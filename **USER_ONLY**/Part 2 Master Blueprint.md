# **Macro Trade Project Part 2: Comprehensive Architecture & Execution Blueprint**

**Project Scope:** Upgrading the Trade Diversification Explorers (Indo-Pacific & EU) from historical dashboards to diagnostic, predictive tools integrating commodity tracking, port logistics, and marine weather.

**Core Philosophy:** "Investigative Journalism UX." Provide the *Everyman* with the context and the data, and let them connect the dots using an interactive timeline.

## **1\. System Architecture: The Unified Codebase**

To prevent duplicating work, the application will use a single React codebase to power two distinct regional experiences.

* **Routing Strategy:** Use standard React routing (/indo-pacific and /eu).  
* **Agnostic Components:** The UI elements (HUD, Map, Cards) contain no hardcoded data. They listen to the active route and fetch the corresponding JSON data payload.  
* **The Landing Page:** The root domain serves as a gateway: *"Which trade strategy do you want to explore?"* with two prominent entry points.

## **2\. The UI/UX Layout: The Modular "Flat" Design**

The 3D globe has been replaced by a Flat, Interactive SVG Map embedded within a modular dashboard to improve performance, expose all data simultaneously, and provide a canvas for ocean weather.

The screen is divided into three functional zones:

### **Zone 1: The Macro HUD (Top Level \- Persistent)**

* **The Master Timeline Slider:** The single source of truth. Scrubbing this updates all metrics, map colors, and port statuses.  
* **Topline Metrics:** Cumulative Canadian Export Value vs. Regional Diversification Value.  
* **The "Value at Risk" (VaR) Ticker:** A dynamic, high-visibility metric (turns red when active) displaying the total dollar amount of trade currently facing logistical delays.

### **Zone 2: The Geographic Canvas & Drill-Down (Main Body)**

* **The Flat Map (SVG):** A clean, 2D map of the target region (Indo-Pacific or EU). Countries are color-coded based on YoY growth or dominant commodity.  
* **The Ocean Transit Routes:** Faint lines connecting Canada to key destination hubs.  
  * *Weather UI:* API-triggered weather alerts appear directly on these routes (e.g., a storm icon in the Pacific).  
* **The Country Drill-Down (Side Drawer):** Slides out from the right when a country is clicked.  
  * Total Value & YoY Trajectory.  
  * **Commodities:** Top 5 exported commodities (CIMT data).  
  * **Narrative Context:** Trade deal notes with exact Month/Year dates to guide the user's slider interaction.

### **Zone 3: The Logistics Dock (Bottom Drawer)**

* Anchored to the bottom of the screen, representing the domestic *origin* of the trade.  
* **Indo-Pacific Focus:** Port of Vancouver, Port of Prince Rupert.  
* **EU Focus:** Port of Montreal, Port of Halifax, Saint John.  
* **Metrics Displayed:** Vessel wait times (days at anchor) and throughput trends mapped to the current position of the Master Timeline.

## **3\. The Data Engine: Sources & Harmonization**

* **Macro Trade (The Baseline):** StatsCan Annual (2021-2025) and Monthly (2026+).  
* **Commodities (The "What"):** CIMT data. *Crucial Rule:* Aggregate at the HS2 (Chapter) or HS4 (Heading) level in the Python backend to prevent UI clutter (e.g., show "Agriculture", not "Durum Wheat").  
* **Ports (The Bottleneck):** Commercial Port APIs (e.g., GoComet, Tradlinx) or Transport Canada updates. Tracking *Median Vessel Wait Time*.  
* **Weather (The Butterfly Effect):** Marine weather APIs (e.g., Xweather) targeting *Significant Wave Height* and *Severe Storm Warnings* over key transit coordinates.

## **4\. The "Value at Risk" (VaR) Logic Engine**

This is the core predictive feature of Part 2\. It connects all three data streams.

**The Triggers:**

1. **Origin Blockage:** Is the median vessel wait time at the origin port \> 5 days?  
2. **Transit Blockage:** Is there a severe marine weather alert on the SVG map's ocean transit route?

**The Calculation:**

* If either trigger fires based on the Master Timeline's current month, the app calculates the VaR.  
* *Formula:* Sum the historical monthly average value of the Top 5 commodities scheduled to travel that route.  
* *Output Example:* "Due to 14-day delays at the Port of Vancouver, **$240 Million** in Agricultural and Energy exports destined for the Indo-Pacific are currently At Risk."

## **5\. Execution Roadmap: 4 Sprints to Production**

* **Sprint 1: UI Refactor & The Flat Map.** Set up the unified router. Build the 3-Zone layout. Implement react-simple-maps for the flat static maps.  
* **Sprint 2: CIMT & Country Drill-Downs.** Write the Python scripts to aggregate HS2/HS4 data. Feed this into the slide-out Panel 2 country cards. Add the "Rank by Commodity" toggle.  
* **Sprint 3: The Origin Dock.** Connect the Port API. Build the bottom drawer. Tie port wait times directly to the Master Timeline Slider.  
* **Sprint 4: The Transit Weather & VaR Engine.** Map weather API coordinates to the ocean space on the SVG map. Build the VaR calculation script that links the Port/Weather triggers to the CIMT dollar values.

## **6\. The Refinement Checklist**

*Before merging any new feature, ask:*

1. Does this serve the "Everyman" (or does it require an economics degree)?  
2. Does this clutter the Geographic Canvas?  
3. Does this help the user prove or disprove Canada's trade diversification hypothesis?