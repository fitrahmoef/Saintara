# Saintara Monitoring Stack

Complete monitoring solution with Prometheus, Grafana, and alerting.

## Quick Start

```bash
cd monitoring
docker-compose up -d
```

## Access URLs

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

## Dashboards

Grafana comes pre-configured with dashboards for:
- Application metrics
- System metrics
- Database performance
- Redis metrics
- Container metrics

## Alert Rules

Configured alerts:
- High error rate (>5%)
- High response time (>1s)
- Service down
- High memory usage (>90%)
- High CPU usage (>80%)
- Database connection pool exhaustion
- Redis high memory

## Metrics Endpoints

Add to your application:

### Backend (Express)
```typescript
import promClient from 'prom-client';

// Collect default metrics
promClient.collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

## Troubleshooting

### Prometheus can't scrape targets
1. Check network connectivity
2. Verify target URLs in prometheus.yml
3. Check firewall rules

### Grafana shows no data
1. Verify Prometheus datasource is configured
2. Check Prometheus is collecting metrics
3. Verify time range in Grafana

## Scaling

For production:
1. Use external storage for Prometheus
2. Set up Prometheus HA
3. Configure remote write to long-term storage
4. Use Grafana Cloud or hosted solution
