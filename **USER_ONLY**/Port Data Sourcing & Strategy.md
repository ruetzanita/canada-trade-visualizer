# **Port Data Strategy: Sourcing & Metrics**

To power the "Logistics Dock" and the "Value at Risk" (VaR) engine, you do not need every single data point a port produces. You only need the metrics that act as early warning indicators for trade disruption.

## **1\. The Two "Golden Metrics" to Track**

For this dashboard, ignore things like "crane moves per hour" or "truck gate turn times." You are tracking macro-level blockages. You only need two metrics:

* **Vessel Time at Anchorage (Days):** How long are ships waiting in the water before they are allowed to dock?  
  * *Why it matters:* This is the leading indicator of port congestion. A normal wait is 1-2 days. During the 2023 BC Port Strike, this spiked to 14+ days.  
* **Terminal/Rail Dwell Time (Days):** Once the container is taken off the ship, how long does it sit on the dock waiting to be loaded onto a CN or CP train?  
  * *Why it matters:* Canada's ports are heavily rail-dependent. If the port is working fine but the rail lines are backed up (due to winter weather or strikes), trade is still blocked.

## **2\. Where to Get the Data (Three Options)**

You have three paths, ranging from free-but-manual to paid-but-effortless.

### **Option A: The Direct Source (Free, Requires Web Scraping)**

Individual port authorities publish their own daily metrics.

* **Port of Vancouver:** They publish a very clean "Daily Dashboard" (search for *Port of Vancouver Operations Performance*). It lists exactly how many ships are at anchor and the daily rail dwell times.  
* **Port of Montreal/Halifax:** Similar portals exist on their respective websites.  
* *The Catch & The Risk:* They don't typically offer a public API. You will need to write a simple Python script using BeautifulSoup or Selenium to scrape this webpage once a day. **Because web scraping is notoriously brittle (if the port updates their CSS, your script breaks), you must build graceful failure states into your UI so a broken scraper doesn't crash the whole React dashboard.**

### **Option B: Transport Canada Open Data (Free, API/CSV)**

Transport Canada has drastically improved its tracking via the **National Supply Chain Office**.

* They operate the *Transportation Data and Information Hub*.  
* They provide datasets on "Containerized freight traffic" and "Vessel traffic."  
* *The Catch:* This data is highly authoritative but can sometimes lag by a few days/weeks compared to the live port dashboards.

### **Option C: Commercial Aggregator APIs (Paid/Freemium, Easiest)**

These companies ingest satellite tracking (AIS) and terminal data globally and sell access via clean REST APIs.

* **GoComet / project44 / FourKites:** These are the gold standard for "Supply Chain Visibility." You can query an endpoint for "Port of Prince Rupert" and instantly get the median delay days.  
* **MarineTraffic API:** The most famous vessel tracker. You can set up "Geofencing" (drawing a digital box around Vancouver's harbor) and use their API to count how many cargo ships have been sitting in that box for more than 48 hours.

## **3\. The Required JSON Data Structure (With Fail-Safes)**

Regardless of how you get the data (scraping or API), your Python backend must normalize it into this exact JSON format before sending it to the React frontend. Note the inclusion of last\_updated and is\_stale to protect your UI from scraper crashes.

{  
  "date\_logged": "2026-06-12",  
  "data\_health": {  
    "last\_updated": "2026-06-12T08:00:00Z",  
    "is\_stale": false  
  },  
  "ports": {  
    "vancouver": {  
      "status": "warning",   
      "vessels\_at\_anchor": 12,  
      "avg\_anchorage\_wait\_days": 6.5,  
      "rail\_dwell\_days": 4.2,  
      "throughput\_trend": "decreasing"  
    },  
    "prince\_rupert": {  
      "status": "normal",  
      "vessels\_at\_anchor": 2,  
      "avg\_anchorage\_wait\_days": 1.1,  
      "rail\_dwell\_days": 2.0,  
      "throughput\_trend": "stable"  
    }  
  }  
}

*Note: If is\_stale is true, the frontend should display a "Data Temporarily Unavailable" badge on the Logistics Dock instead of triggering false VaR calculations.*

## **4\. Managing the Master Timeline (The Historical Gap)**

Your Master Timeline goes back to 2021\. If you launch this scraper today, you will have a massive data gap for past dates.

**The Execution Plan for the Gap:**

1. **For Pre-2026 Dates:** The React UI will conditionally check the slider's year. If it is prior to the scraper's launch date, the Port Logistics Dock will "grey out" and display a tooltip: *"Archived logistics data unavailable for this period."* This prevents the app from crashing while looking for null data.  
2. **Targeted Backfilling (Optional):** To prove the VaR concept historically, we will manually hardcode the port metrics for exactly *one* major historical event: The July 2023 BC Port Strike. This ensures that when the user scrubs back to that specific narrative point, the dashboard correctly lights up red and demonstrates the massive historical Value at Risk.