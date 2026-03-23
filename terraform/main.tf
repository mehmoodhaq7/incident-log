provider "aws" {
  region = "us-east-1"
}

resource "aws_vpc" "incident_log_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "incident-log-vpc"
  }
}

resource "aws_subnet" "incident_log_subnet" {
  count                   = 2
  vpc_id                  = aws_vpc.incident_log_vpc.id
  cidr_block              = cidrsubnet(aws_vpc.incident_log_vpc.cidr_block, 8, count.index)
  availability_zone       = element(["us-east-1a", "us-east-1b"], count.index)
  map_public_ip_on_launch = true

  tags = {
    Name = "incident-log-subnet-${count.index}"
  }
}

resource "aws_internet_gateway" "incident_log_igw" {
  vpc_id = aws_vpc.incident_log_vpc.id

  tags = {
    Name = "incident-log-igw"
  }
}

resource "aws_route_table" "incident_log_route_table" {
  vpc_id = aws_vpc.incident_log_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.incident_log_igw.id
  }

  tags = {
    Name = "incident-log-route-table"
  }
}

resource "aws_route_table_association" "incident_log_association" {
  count          = 2
  subnet_id      = aws_subnet.incident_log_subnet[count.index].id
  route_table_id = aws_route_table.incident_log_route_table.id
}

resource "aws_security_group" "incident_log_cluster_sg" {
  vpc_id = aws_vpc.incident_log_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "incident-log-cluster-sg"
  }
}

resource "aws_security_group" "incident_log_node_sg" {
  vpc_id = aws_vpc.incident_log_vpc.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "incident-log-node-sg"
  }
}

resource "aws_eks_cluster" "incident_log" {
  name     = "incident-log-cluster"
  role_arn = aws_iam_role.incident_log_cluster_role.arn

  vpc_config {
    subnet_ids         = aws_subnet.incident_log_subnet[*].id
    security_group_ids = [aws_security_group.incident_log_cluster_sg.id]
  }
}

resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name                = aws_eks_cluster.incident_log.name
  addon_name                  = "aws-ebs-csi-driver"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"
}

resource "aws_eks_node_group" "incident_log" {
  cluster_name    = aws_eks_cluster.incident_log.name
  node_group_name = "incident-log-node-group"
  node_role_arn   = aws_iam_role.incident_log_node_group_role.arn
  subnet_ids      = aws_subnet.incident_log_subnet[*].id

  scaling_config {
    desired_size = 2
    max_size     = 2
    min_size     = 2
  }

  instance_types = ["t2.medium"]

  remote_access {
    ec2_ssh_key               = var.ssh_key_name
    source_security_group_ids = [aws_security_group.incident_log_node_sg.id]
  }
}

resource "aws_iam_role" "incident_log_cluster_role" {
  name = "incident-log-cluster-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "eks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "incident_log_cluster_role_policy" {
  role       = aws_iam_role.incident_log_cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role" "incident_log_node_group_role" {
  name = "incident-log-node-group-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "incident_log_node_group_role_policy" {
  role       = aws_iam_role.incident_log_node_group_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

resource "aws_iam_role_policy_attachment" "incident_log_node_group_cni_policy" {
  role       = aws_iam_role.incident_log_node_group_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "incident_log_node_group_registry_policy" {
  role       = aws_iam_role.incident_log_node_group_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "incident_log_node_group_ebs_policy" {
  role       = aws_iam_role.incident_log_node_group_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}