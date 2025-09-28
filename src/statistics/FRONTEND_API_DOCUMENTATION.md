# Statistics API - Frontend Developer Guide

This document provides comprehensive information for frontend developers to integrate with the Statistics API endpoints.

## Authentication & Authorization

**Required Headers:**
```javascript
{
  "Authorization": "Bearer <admin_jwt_token>",
  "Content-Type": "application/json"
}
```

**Note:** All statistics endpoints require ADMIN role. Ensure the JWT token belongs to an admin user.

---

## API Endpoints Overview

Base URL: `/api/v1/statistics`

| Endpoint | Method | Purpose | Frontend Use Case |
|----------|--------|---------|-------------------|
| `/dashboard` | GET | Complete dashboard overview | Main admin dashboard |
| `/totals` | GET | Entity counts | Summary cards/widgets |
| `/applications/status` | GET | Application status breakdown | Status distribution charts |
| `/applications/detailed` | GET | Comprehensive app analytics | Detailed reports page |
| `/applications/trends` | GET | Daily application trends | Trend line charts |
| `/geographic` | GET | Geographic distribution | World maps, regional analysis |
| `/programs/popular` | GET | Popular programs ranking | Program demand charts |
| `/universities/top` | GET | Top universities by apps | University rankings |
| `/growth` | GET | Monthly growth metrics | Growth trend charts |
| `/engagement` | GET | User engagement stats | Conversion funnel analysis |

---

## 1. Dashboard Statistics

**Endpoint:** `GET /statistics/dashboard`

**Purpose:** Complete admin dashboard overview with all key metrics.

**Query Parameters:**
```typescript
interface QueryParams {
  period?: 'last_7_days' | 'last_30_days' | 'last_3_months' | 'last_6_months' | 'last_year' | 'all_time';
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  limit?: number;     // Max results (1-100)
}
```

**Example Request:**
```javascript
// Basic request
const response = await fetch('/api/v1/statistics/dashboard', {
  headers: {
    'Authorization': 'Bearer ' + adminToken,
    'Content-Type': 'application/json'
  }
});

// With filters
const response = await fetch('/api/v1/statistics/dashboard?period=last_30_days&limit=5', {
  headers: {
    'Authorization': 'Bearer ' + adminToken,
    'Content-Type': 'application/json'
  }
});
```

**Response Example:**
```json
{
  "totalCounts": {
    "universities": 150,
    "programs": 2500,
    "applications": 5000,
    "profiles": 8000,
    "countries": 45,
    "cities": 300,
    "messages": 12000
  },
  "applicationStats": {
    "DRAFT": 1200,
    "SUBMITTED": 2500,
    "UNDER_REVIEW": 800,
    "APPROVED": 1000,
    "REJECTED": 500
  },
  "geographicDistribution": [
    {
      "countryCode": 860,
      "countryName": "Uzbekistan",
      "universitiesCount": 25,
      "applicationsCount": 1500,
      "studentsCount": 3000
    }
  ],
  "popularPrograms": [
    {
      "programId": "abc123-def456",
      "programTitle": "Computer Science",
      "applicationsCount": 450,
      "universitiesCount": 15,
      "averageTuitionFee": 5000
    }
  ],
  "topUniversities": [
    {
      "universityId": "uni123-abc456",
      "universityName": "Tashkent University of Information Technologies",
      "applicationsCount": 300,
      "programsCount": 25,
      "countryName": "Uzbekistan",
      "cityName": "Tashkent"
    }
  ],
  "growthStats": [
    {
      "period": "2024-03",
      "newProfiles": 120,
      "newApplications": 250,
      "messagesCount": 800
    }
  ],
  "activitySummary": {
    "activeUsers": 7500,
    "thisMonthApplications": 450,
    "lastMonthApplications": 380,
    "monthOverMonthGrowth": 18.4,
    "averageApplicationsPerUser": 1.8,
    "popularIntakeSeason": "FALL"
  }
}
```

**Frontend Implementation Example:**
```jsx
// React component for dashboard
const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/v1/statistics/dashboard', {
          headers: {
            'Authorization': `Bearer ${getAdminToken()}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <SummaryCards data={dashboardData.totalCounts} />
      <ApplicationStatusChart data={dashboardData.applicationStats} />
      <GrowthChart data={dashboardData.growthStats} />
      <GeographicMap data={dashboardData.geographicDistribution} />
    </div>
  );
};
```

---

## 2. Total Counts

**Endpoint:** `GET /statistics/totals`

**Purpose:** Quick overview of entity counts for summary cards.

**Example Request:**
```javascript
const response = await fetch('/api/v1/statistics/totals', {
  headers: {
    'Authorization': 'Bearer ' + adminToken
  }
});
```

**Response Example:**
```json
{
  "universities": 150,
  "programs": 2500,
  "applications": 5000,
  "profiles": 8000,
  "countries": 45,
  "cities": 300,
  "messages": 12000
}
```

**Frontend Implementation:**
```jsx
// Summary cards component
const SummaryCards = ({ data }) => {
  const cards = [
    { title: 'Universities', value: data.universities, icon: '🏫', color: 'blue' },
    { title: 'Applications', value: data.applications, icon: '📄', color: 'green' },
    { title: 'Students', value: data.profiles, icon: '👥', color: 'purple' },
    { title: 'Messages', value: data.messages, icon: '💬', color: 'orange' }
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div key={index} className={`card bg-${card.color}-100 p-4 rounded-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
            </div>
            <span className="text-2xl">{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 3. Application Status Statistics

**Endpoint:** `GET /statistics/applications/status`

**Purpose:** Application pipeline visualization and status distribution.

**Query Parameters:**
```typescript
interface QueryParams {
  period?: string;
  startDate?: string;
  endDate?: string;
}
```

**Response Example:**
```json
{
  "DRAFT": 1200,
  "SUBMITTED": 2500,
  "UNDER_REVIEW": 800,
  "APPROVED": 1000,
  "REJECTED": 500
}
```

**Frontend Implementation (Chart.js):**
```jsx
import { Doughnut } from 'react-chartjs-2';

const ApplicationStatusChart = ({ data }) => {
  const chartData = {
    labels: Object.keys(data),
    datasets: [{
      data: Object.values(data),
      backgroundColor: [
        '#FCD34D', // DRAFT - Yellow
        '#60A5FA', // SUBMITTED - Blue
        '#F97316', // UNDER_REVIEW - Orange
        '#10B981', // APPROVED - Green
        '#EF4444'  // REJECTED - Red
      ],
      borderWidth: 2
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label;
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">Application Status Distribution</h3>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};
```

---

## 4. Application Trends

**Endpoint:** `GET /statistics/applications/trends`

**Purpose:** Daily application trends for line charts.

**Query Parameters:**
```typescript
interface QueryParams {
  days?: number; // 7-365, default 30
}
```

**Response Example:**
```json
[
  {
    "date": "2024-03-01",
    "count": 15
  },
  {
    "date": "2024-03-02",
    "count": 23
  }
]
```

**Frontend Implementation (Chart.js Line Chart):**
```jsx
import { Line } from 'react-chartjs-2';

const ApplicationTrendsChart = () => {
  const [trendsData, setTrendsData] = useState([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchTrends = async () => {
      const response = await fetch(`/api/v1/statistics/applications/trends?days=${days}`, {
        headers: { 'Authorization': `Bearer ${getAdminToken()}` }
      });
      const data = await response.json();
      setTrendsData(data);
    };

    fetchTrends();
  }, [days]);

  const chartData = {
    labels: trendsData.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [{
      label: 'Applications',
      data: trendsData.map(item => item.count),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Application Trends (Last ${days} days)`
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Applications'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="mr-2">Time Period:</label>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 3 months</option>
        </select>
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
};
```

---

## 5. Geographic Distribution

**Endpoint:** `GET /statistics/geographic`

**Purpose:** World map visualization and regional analysis.

**Query Parameters:**
```typescript
interface QueryParams {
  limit?: number; // Max countries to return
}
```

**Response Example:**
```json
[
  {
    "countryCode": 860,
    "countryName": "Uzbekistan",
    "universitiesCount": 25,
    "applicationsCount": 1500,
    "studentsCount": 3000
  }
]
```

**Frontend Implementation (World Map):**
```jsx
// Using react-simple-maps for world map
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const GeographicMap = ({ data }) => {
  const maxApplications = Math.max(...data.map(d => d.applicationsCount));
  
  const getColorScale = (count) => {
    const intensity = count / maxApplications;
    return `rgba(59, 130, 246, ${intensity})`;
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
      <ComposableMap>
        <Geographies geography="/world-110m.json">
          {({ geographies }) =>
            geographies.map(geo => {
              const countryData = data.find(d => d.countryCode === geo.properties.ISO_N3);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={countryData ? getColorScale(countryData.applicationsCount) : '#F3F4F6'}
                  stroke="#FFFFFF"
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', cursor: 'pointer' },
                    pressed: { outline: 'none' }
                  }}
                  onMouseEnter={() => {
                    if (countryData) {
                      setTooltip({
                        name: countryData.countryName,
                        universities: countryData.universitiesCount,
                        applications: countryData.applicationsCount,
                        students: countryData.studentsCount
                      });
                    }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      
      {/* Data table */}
      <div className="mt-6">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2">Country</th>
              <th className="border border-gray-300 p-2">Universities</th>
              <th className="border border-gray-300 p-2">Applications</th>
              <th className="border border-gray-300 p-2">Students</th>
            </tr>
          </thead>
          <tbody>
            {data.map((country, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">{country.countryName}</td>
                <td className="border border-gray-300 p-2">{country.universitiesCount}</td>
                <td className="border border-gray-300 p-2">{country.applicationsCount}</td>
                <td className="border border-gray-300 p-2">{country.studentsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

## 6. Growth Statistics

**Endpoint:** `GET /statistics/growth`

**Purpose:** Monthly growth trends for business analytics.

**Query Parameters:**
```typescript
interface QueryParams {
  months?: number; // Number of months, default 12
}
```

**Response Example:**
```json
[
  {
    "period": "2024-01",
    "newProfiles": 120,
    "newApplications": 250,
    "messagesCount": 800
  },
  {
    "period": "2024-02",
    "newProfiles": 135,
    "newApplications": 280,
    "messagesCount": 920
  }
]
```

**Frontend Implementation (Multi-line Chart):**
```jsx
import { Line } from 'react-chartjs-2';

const GrowthChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.period + '-01');
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }),
    datasets: [
      {
        label: 'New Profiles',
        data: data.map(item => item.newProfiles),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'New Applications',
        data: data.map(item => item.newApplications),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Messages',
        data: data.map(item => item.messagesCount),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Platform Growth Trends'
      },
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <Line data={chartData} options={options} />
    </div>
  );
};
```

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2024-03-15T10:30:00.000Z",
  "path": "/api/v1/statistics/dashboard"
}
```

**Common Error Codes:**
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `400`: Bad Request (invalid parameters)
- `500`: Internal Server Error

**Frontend Error Handling:**
```javascript
const fetchWithErrorHandling = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getAdminToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      switch (response.status) {
        case 401:
          // Redirect to login
          window.location.href = '/admin/login';
          break;
        case 403:
          throw new Error('Access denied. Admin privileges required.');
        case 400:
          throw new Error(`Invalid request: ${errorData.message}`);
        default:
          throw new Error(`Server error: ${errorData.message}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

---

## Performance Optimization

**1. Caching Strategy:**
```javascript
// Cache dashboard data for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let dashboardCache = null;
let cacheTimestamp = null;

const getCachedDashboardData = async () => {
  const now = Date.now();
  
  if (dashboardCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    return dashboardCache;
  }
  
  const data = await fetchWithErrorHandling('/api/v1/statistics/dashboard');
  dashboardCache = data;
  cacheTimestamp = now;
  
  return data;
};
```

**2. Progressive Loading:**
```javascript
// Load critical data first, then additional details
const loadDashboardProgressively = async () => {
  // Load essential data first
  setLoading(true);
  const totals = await fetchWithErrorHandling('/api/v1/statistics/totals');
  setTotalCounts(totals);
  setLoading(false);
  
  // Load additional data in background
  const [statusStats, trends, geographic] = await Promise.all([
    fetchWithErrorHandling('/api/v1/statistics/applications/status'),
    fetchWithErrorHandling('/api/v1/statistics/applications/trends?days=7'),
    fetchWithErrorHandling('/api/v1/statistics/geographic?limit=5')
  ]);
  
  setStatusStats(statusStats);
  setTrends(trends);
  setGeographic(geographic);
};
```

**3. Real-time Updates:**
```javascript
// Set up polling for real-time updates
const useRealTimeStats = (interval = 30000) => { // 30 seconds
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await fetchWithErrorHandling('/api/v1/statistics/totals');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch real-time stats:', error);
      }
    };
    
    fetchStats(); // Initial load
    const intervalId = setInterval(fetchStats, interval);
    
    return () => clearInterval(intervalId);
  }, [interval]);
  
  return stats;
};
```

---

## Complete Dashboard Example

```jsx
import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';

const CompleteDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await fetchWithErrorHandling('/api/v1/statistics/dashboard');
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error loading dashboard: {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <SummaryCards data={dashboardData.totalCounts} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <ApplicationStatusChart data={dashboardData.applicationStats} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <GrowthChart data={dashboardData.growthStats} />
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Popular Programs</h3>
          <PopularProgramsTable data={dashboardData.popularPrograms} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Universities</h3>
          <TopUniversitiesTable data={dashboardData.topUniversities} />
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
        <ActivitySummary data={dashboardData.activitySummary} />
      </div>
    </div>
  );
};

export default CompleteDashboard;
```

This documentation provides everything frontend developers need to successfully integrate with the Statistics API, including complete examples, error handling, and performance optimization strategies.