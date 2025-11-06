# K6 Load Testing

## Prerequisites
```bash
# Install K6
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

## Running Tests

### Authentication Load Test
```bash
k6 run auth-load-test.js
```

### Complete User Flow Test
```bash
k6 run test-flow.js
```

### Stress Test
```bash
k6 run stress-test.js
```

### With Custom Options
```bash
# Set base URL
k6 run -e BASE_URL=https://api.saintara.com auth-load-test.js

# Increase VUs
k6 run --vus 100 --duration 5m stress-test.js

# Output results to JSON
k6 run --out json=test-results.json auth-load-test.js
```

## Metrics to Monitor
- `http_req_duration`: Request duration
- `http_req_failed`: Failed request rate
- `errors`: Custom error metric
- `http_reqs`: Total requests
- `vus`: Virtual users
- `iterations`: Completed iterations

## Thresholds
Tests will fail if:
- 95% of requests take longer than 500ms
- Error rate exceeds 1%
- Any request takes longer than 2s
