# **Indo-Pacific Macro Project: Core Explainer & Reference Guide**

**Project:** Canada's Trade Diversification Explorer (Indo-Pacific Edition)

**Purpose of this Document:** A definitive reference guide to maintain alignment on design, data logic, and user experience while refining and coding the application.

## **1\. The Core Philosophy: "Investigative Journalism UX"**

This application is not just a dashboard; it is a tool for hypothesis testing. We are building this for "The Everyman" who hears political talking points and wants to see the receipts.

* **The Rule:** Do not force conclusions on the user. Provide the context (the *claim*) and the data (the *reality*), and let them connect the dots.  
* **The Mechanism:** The user reads a date regarding a trade mission or deal in the Country Card, then actively scrubs the global timeline slider to that date to see if the monetary value on the screen went up or down.

## **2\. Target Region & Country Groupings**

To maintain a clear narrative without overwhelming the map, the data is focused on the following specific groups within and adjacent to the Indo-Pacific strategy.

* **The Comparative Heavyweight:**  
  * **China:** Essential for the narrative. As Canada seeks to diversify, China serves as the massive comparative baseline to show the scale of emerging markets versus established, complex trade relationships.  
* **Top Focus Economies (The Pivot Targets):**  
  * *Note: Canada is actively negotiating a Free Trade Agreement with the ASEAN bloc. Several of these countries are crucial to that narrative.*  
  * India  
  * South Korea  
  * Indonesia *(ASEAN)*  
  * Philippines *(ASEAN)*  
  * Thailand *(ASEAN)*  
  * Taiwan  
  * Hong Kong  
  * **Bangladesh:** *(Crucial addition: It is frequently Canada's second-largest export destination in South Asia, heavily driven by agricultural and fertilizer/potash exports).*  
* **The CPTPP Bloc (Comprehensive and Progressive Agreement for Trans-Pacific Partnership):**  
  * Australia  
  * Brunei *(ASEAN)*  
  * Japan  
  * Malaysia *(ASEAN)*  
  * Mexico  
  * New Zealand  
  * Peru  
  * Singapore *(ASEAN)*  
  * Vietnam *(ASEAN)*  
* **South American Context (Pacific-Adjacent):**  
  * Chile (Specific focus / CPTPP member)  
  * Brazil (Specific focus)  
  * *Conglomerate:* "Rest of South America" (Aggregated data for the remaining continent to show broader regional trends without individual country clutter).

## **3\. The UI/UX Contract (Layout Rules)**

To keep the cognitive load low for a non-technical audience, the screen real estate must strictly adhere to this hierarchy:

### **The Global View (Always Visible)**

* **The 3D Globe:** The primary visual anchor. Export lines flow *from* Canada *to* target regions. Line thickness/brightness should correlate to total export value.  
* **The Master Timeline Slider:** The single source of truth for the application's state. Moving this updates *everything* else on the screen. It must NOT be cluttered with text or dates.  
* **The HUD (Heads Up Display):**  
  * Cumulative Export Value (Total)  
  * Diversification Export Value (Total minus USA)  
  * Sankey Graph (Visualizing dispersal percentages to the target countries/groups)

### **The Granular View (On-Demand)**

* **The Country Card:** Triggered by clicking a country on the globe. This is where the narrative lives.  
  * **Rule:** Keep qualitative context short. Bullet points are better than paragraphs.  
  * **Crucial Element:** Trade deal notes/initiatives *must* include specific Month/Year dates. This is the instruction manual for how the user should use the Master Timeline Slider.

## **4\. The Data Engine (Logic & Harmonization)**

Because we are bridging historical baselines with live tracking, the data logic must be strictly maintained in the Python backend before it hits the React frontend.

* **Historical Data Phase (2021 \- 2025):**  
  * *Source:* StatsCan Annual Data.  
  * *Slider Behavior:* Slider snaps to whole years. Data displayed is total annual value.  
* **Current Tracking Phase (2026+):**  
  * *Source:* StatsCan Monthly Data.  
  * *Slider Behavior:* Slider snaps to monthly increments.  
  * *Math:* Visuals display Year-to-Date (YTD) cumulative values, compared against the identical YTD period of the previous year (e.g., June 2026 vs June 2025).  
* **Data Structure Goal:** A single, clean JSON payload per country (or conglomerate group), per time-period, combining StatsCan quantitative numbers with CIMT commodity data and our custom qualitative backgrounders.

## **5\. The Refinement Checklist**

*Before adding a new feature, dataset, or visual flourish to the Indo-Pacific build, ask these three questions:*

1. **Does this serve the "Everyman"?** (If it requires a degree in economics to understand, simplify or remove it).  
2. **Does this clutter the Global View?** (If yes, move it into the Country Card).  
3. **Does it answer the Core Question?** (Does this help the user see if Canada's trade diversification pivot is actually materializing?)