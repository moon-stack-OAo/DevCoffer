/** 由 scripts/extract-ref-data.mjs 从旧站抽取，勿手改大数据 */
export default {
  "kind": "flat",
  "data": [
    {
      "port": "80",
      "proto": "TCP",
      "service": "HTTP",
      "cat": "Web",
      "desc": "HTTP 默认端口"
    },
    {
      "port": "443",
      "proto": "TCP",
      "service": "HTTPS",
      "cat": "Web",
      "desc": "HTTPS（HTTP + TLS）"
    },
    {
      "port": "8080",
      "proto": "TCP",
      "service": "HTTP-Alt",
      "cat": "Web",
      "desc": "Tomcat / Spring Boot 默认 / HTTP 备用"
    },
    {
      "port": "8443",
      "proto": "TCP",
      "service": "HTTPS-Alt",
      "cat": "Web",
      "desc": "Tomcat SSL / HTTPS 备用"
    },
    {
      "port": "8000",
      "proto": "TCP",
      "service": "HTTP-Alt",
      "cat": "Web",
      "desc": "Django dev server / httpd-alt"
    },
    {
      "port": "3000",
      "proto": "TCP",
      "service": "HTTP-Alt",
      "cat": "Web",
      "desc": "Node.js / React dev / Grafana"
    },
    {
      "port": "4200",
      "proto": "TCP",
      "service": "HTTP-Alt",
      "cat": "Web",
      "desc": "Angular dev server"
    },
    {
      "port": "5000",
      "proto": "TCP",
      "service": "HTTP-Alt",
      "cat": "Web",
      "desc": "Flask / .NET Kestrel / Docker Registry"
    },
    {
      "port": "9000",
      "proto": "TCP",
      "service": "HTTP-Alt",
      "cat": "Web",
      "desc": "PHP-FPM / MinIO / SonarQube"
    },
    {
      "port": "5601",
      "proto": "TCP",
      "service": "HTTP-Alt",
      "cat": "Web",
      "desc": "Kibana"
    },
    {
      "port": "8888",
      "proto": "TCP",
      "service": "HTTP-Alt",
      "cat": "Web",
      "desc": "Jupyter Notebook"
    },
    {
      "port": "8081-8089",
      "proto": "TCP",
      "service": "HTTP-Alt",
      "cat": "Web",
      "desc": "Tomcat / Spring 备用端口"
    },
    {
      "port": "3306",
      "proto": "TCP",
      "service": "MySQL",
      "cat": "数据库",
      "desc": "MySQL / MariaDB"
    },
    {
      "port": "5432",
      "proto": "TCP",
      "service": "PostgreSQL",
      "cat": "数据库",
      "desc": "PostgreSQL"
    },
    {
      "port": "1521",
      "proto": "TCP",
      "service": "Oracle",
      "cat": "数据库",
      "desc": "Oracle DB TNS Listener"
    },
    {
      "port": "1433",
      "proto": "TCP",
      "service": "MSSQL",
      "cat": "数据库",
      "desc": "SQL Server"
    },
    {
      "port": "27017",
      "proto": "TCP",
      "service": "MongoDB",
      "cat": "数据库",
      "desc": "MongoDB"
    },
    {
      "port": "6379",
      "proto": "TCP",
      "service": "Redis",
      "cat": "数据库",
      "desc": "Redis（缓存 / 数据库）"
    },
    {
      "port": "11211",
      "proto": "TCP",
      "service": "Memcached",
      "cat": "数据库",
      "desc": "Memcached"
    },
    {
      "port": "5984",
      "proto": "TCP",
      "service": "CouchDB",
      "cat": "数据库",
      "desc": "CouchDB"
    },
    {
      "port": "9200",
      "proto": "TCP",
      "service": "Elasticsearch",
      "cat": "数据库",
      "desc": "Elasticsearch HTTP"
    },
    {
      "port": "9300",
      "proto": "TCP",
      "service": "Elasticsearch",
      "cat": "数据库",
      "desc": "Elasticsearch 节点间通信"
    },
    {
      "port": "8529",
      "proto": "TCP",
      "service": "ArangoDB",
      "cat": "数据库",
      "desc": "ArangoDB"
    },
    {
      "port": "28015",
      "proto": "TCP",
      "service": "RethinkDB",
      "cat": "数据库",
      "desc": "RethinkDB"
    },
    {
      "port": "7474",
      "proto": "TCP",
      "service": "Neo4j",
      "cat": "数据库",
      "desc": "Neo4j HTTP"
    },
    {
      "port": "7687",
      "proto": "TCP",
      "service": "Neo4j",
      "cat": "数据库",
      "desc": "Neo4j Bolt"
    },
    {
      "port": "5672",
      "proto": "TCP",
      "service": "RabbitMQ",
      "cat": "消息队列",
      "desc": "RabbitMQ AMQP"
    },
    {
      "port": "15672",
      "proto": "TCP",
      "service": "RabbitMQ-UI",
      "cat": "消息队列",
      "desc": "RabbitMQ 管理界面"
    },
    {
      "port": "9092",
      "proto": "TCP",
      "service": "Kafka",
      "cat": "消息队列",
      "desc": "Apache Kafka Broker"
    },
    {
      "port": "2181",
      "proto": "TCP",
      "service": "Zookeeper",
      "cat": "消息队列",
      "desc": "Zookeeper 客户端"
    },
    {
      "port": "4222",
      "proto": "TCP",
      "service": "NATS",
      "cat": "消息队列",
      "desc": "NATS 客户端"
    },
    {
      "port": "1883",
      "proto": "TCP",
      "service": "MQTT",
      "cat": "消息队列",
      "desc": "MQTT（IoT 协议）"
    },
    {
      "port": "8883",
      "proto": "TCP",
      "service": "MQTT-SSL",
      "cat": "消息队列",
      "desc": "MQTT over SSL/TLS"
    },
    {
      "port": "61613",
      "proto": "TCP",
      "service": "STOMP",
      "cat": "消息队列",
      "desc": "ActiveMQ STOMP"
    },
    {
      "port": "8161",
      "proto": "TCP",
      "service": "ActiveMQ-UI",
      "cat": "消息队列",
      "desc": "ActiveMQ Web Console"
    },
    {
      "port": "8983",
      "proto": "TCP",
      "service": "Solr",
      "cat": "搜索",
      "desc": "Apache Solr HTTP"
    },
    {
      "port": "9200",
      "proto": "TCP",
      "service": "Elasticsearch",
      "cat": "搜索",
      "desc": "Elasticsearch HTTP API"
    },
    {
      "port": "22",
      "proto": "TCP",
      "service": "SSH",
      "cat": "远程",
      "desc": "Secure Shell（远程登录）"
    },
    {
      "port": "21",
      "proto": "TCP",
      "service": "FTP",
      "cat": "远程",
      "desc": "File Transfer Protocol"
    },
    {
      "port": "23",
      "proto": "TCP",
      "service": "Telnet",
      "cat": "远程",
      "desc": "Telnet（明文，不推荐）"
    },
    {
      "port": "25",
      "proto": "TCP",
      "service": "SMTP",
      "cat": "远程",
      "desc": "邮件发送"
    },
    {
      "port": "110",
      "proto": "TCP",
      "service": "POP3",
      "cat": "远程",
      "desc": "邮件接收（明文）"
    },
    {
      "port": "143",
      "proto": "TCP",
      "service": "IMAP",
      "cat": "远程",
      "desc": "邮件接收"
    },
    {
      "port": "993",
      "proto": "TCP",
      "service": "IMAPS",
      "cat": "远程",
      "desc": "IMAP over SSL"
    },
    {
      "port": "995",
      "proto": "TCP",
      "service": "POP3S",
      "cat": "远程",
      "desc": "POP3 over SSL"
    },
    {
      "port": "465",
      "proto": "TCP",
      "service": "SMTPS",
      "cat": "远程",
      "desc": "SMTP over SSL"
    },
    {
      "port": "587",
      "proto": "TCP",
      "service": "SMTP-Sub",
      "cat": "远程",
      "desc": "SMTP Submission（STARTTLS）"
    },
    {
      "port": "53",
      "proto": "TCP/UDP",
      "service": "DNS",
      "cat": "远程",
      "desc": "Domain Name System"
    },
    {
      "port": "67",
      "proto": "UDP",
      "service": "DHCP-Server",
      "cat": "远程",
      "desc": "DHCP 服务器"
    },
    {
      "port": "68",
      "proto": "UDP",
      "service": "DHCP-Client",
      "cat": "远程",
      "desc": "DHCP 客户端"
    },
    {
      "port": "69",
      "proto": "UDP",
      "service": "TFTP",
      "cat": "远程",
      "desc": "Trivial File Transfer"
    },
    {
      "port": "123",
      "proto": "UDP",
      "service": "NTP",
      "cat": "远程",
      "desc": "Network Time Protocol"
    },
    {
      "port": "161",
      "proto": "UDP",
      "service": "SNMP",
      "cat": "远程",
      "desc": "Simple Network Management"
    },
    {
      "port": "389",
      "proto": "TCP",
      "service": "LDAP",
      "cat": "远程",
      "desc": "LDAP"
    },
    {
      "port": "636",
      "proto": "TCP",
      "service": "LDAPS",
      "cat": "远程",
      "desc": "LDAP over SSL"
    },
    {
      "port": "2375",
      "proto": "TCP",
      "service": "Docker",
      "cat": "容器",
      "desc": "Docker daemon（明文，不推荐暴露公网）"
    },
    {
      "port": "2376",
      "proto": "TCP",
      "service": "Docker-TLS",
      "cat": "容器",
      "desc": "Docker daemon over TLS"
    },
    {
      "port": "6443",
      "proto": "TCP",
      "service": "K8s-API",
      "cat": "容器",
      "desc": "Kubernetes API Server"
    },
    {
      "port": "10250",
      "proto": "TCP",
      "service": "Kubelet",
      "cat": "容器",
      "desc": "Kubelet API（只读）"
    },
    {
      "port": "10255",
      "proto": "TCP",
      "service": "Kubelet-RO",
      "cat": "容器",
      "desc": "Kubelet 只读端口"
    },
    {
      "port": "10251",
      "proto": "TCP",
      "service": "kube-scheduler",
      "cat": "容器",
      "desc": "K8s scheduler"
    },
    {
      "port": "10252",
      "proto": "TCP",
      "service": "kube-controller",
      "cat": "容器",
      "desc": "K8s controller-manager"
    },
    {
      "port": "30000-32767",
      "proto": "TCP",
      "service": "NodePort",
      "cat": "容器",
      "desc": "K8s NodePort 服务范围"
    },
    {
      "port": "9090",
      "proto": "TCP",
      "service": "Prometheus",
      "cat": "监控",
      "desc": "Prometheus HTTP"
    },
    {
      "port": "9100",
      "proto": "TCP",
      "service": "Node Exporter",
      "cat": "监控",
      "desc": "Prometheus node_exporter"
    },
    {
      "port": "3000",
      "proto": "TCP",
      "service": "Grafana",
      "cat": "监控",
      "desc": "Grafana（注意与 Node 冲突）"
    },
    {
      "port": "5044",
      "proto": "TCP",
      "service": "Logstash-Beats",
      "cat": "监控",
      "desc": "Filebeat → Logstash"
    },
    {
      "port": "514",
      "proto": "UDP",
      "service": "Syslog",
      "cat": "监控",
      "desc": "系统日志（UDP）"
    },
    {
      "port": "601",
      "proto": "TCP",
      "service": "Syslog-TLS",
      "cat": "监控",
      "desc": "系统日志（TLS）"
    },
    {
      "port": "16686",
      "proto": "TCP",
      "service": "Jaeger-UI",
      "cat": "监控",
      "desc": "Jaeger Query UI"
    },
    {
      "port": "3389",
      "proto": "TCP",
      "service": "RDP",
      "cat": "其他",
      "desc": "Windows 远程桌面"
    },
    {
      "port": "5900",
      "proto": "TCP",
      "service": "VNC",
      "cat": "其他",
      "desc": "VNC 远程桌面"
    },
    {
      "port": "1080",
      "proto": "TCP",
      "service": "SOCKS",
      "cat": "其他",
      "desc": "SOCKS 代理"
    },
    {
      "port": "3128",
      "proto": "TCP",
      "service": "Squid",
      "cat": "其他",
      "desc": "Squid HTTP 代理"
    },
    {
      "port": "4000",
      "proto": "TCP",
      "service": "SvelteKit",
      "cat": "其他",
      "desc": "SvelteKit / Vue dev (旧)"
    },
    {
      "port": "5173",
      "proto": "TCP",
      "service": "Vite",
      "cat": "其他",
      "desc": "Vite dev server 默认端口"
    },
    {
      "port": "4173",
      "proto": "TCP",
      "service": "Vite-Preview",
      "cat": "其他",
      "desc": "Vite preview 端口"
    },
    {
      "port": "6000-6063",
      "proto": "TCP",
      "service": "X11",
      "cat": "其他",
      "desc": "X Window System"
    }
  ]
} as const
