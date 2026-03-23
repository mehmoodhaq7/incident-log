output "cluster_id" {
  value = aws_eks_cluster.incident_log.id
}

output "node_group_id" {
  value = aws_eks_node_group.incident_log.id
}

output "vpc_id" {
  value = aws_vpc.incident_log_vpc.id
}

output "subnet_ids" {
  value = aws_subnet.incident_log_subnet[*].id
}

output "cluster_endpoint" {
  value = aws_eks_cluster.incident_log.endpoint
}