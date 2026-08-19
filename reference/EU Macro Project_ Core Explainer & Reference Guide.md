# **EU Macro Project: Core Explainer & Reference Guide**

**Project:** Canada's Trade Diversification Explorer (European Edition)

**Purpose of this Document:** A definitive reference guide to maintain alignment on design, data logic, and user experience while building the EU counterpart to the Indo-Pacific map.

## **1\. The Core Philosophy: "Investigative Journalism UX"**

(Identical to the Indo-Pacific Build)

This application is a tool for hypothesis testing. We provide the context (the *claim*) and the data (the *reality*), and let the user connect the dots via the Master Timeline Slider.

* **The Mechanism:** The user reads a date regarding a trade mission or deal in the Country Card, then actively scrubs the global timeline slider to that date to see if the monetary value on the screen went up or down.

## **2\. Target Region & Country Groupings**

To ensure comprehensive tracking of the European economic landscape, data will be pulled for the entirety of the EU, alongside specific strategic non-EU partners.

* **The CETA Core (EU27):**  
  1. Austria  
  2. Belgium  
  3. Bulgaria  
  4. Croatia  
  5. Cyprus  
  6. Czechia  
  7. Denmark  
  8. Estonia  
  9. Finland  
  10. France  
  11. Germany  
  12. Greece  
  13. Hungary  
  14. Ireland  
  15. Italy  
  16. Latvia  
  17. Lithuania  
  18. Luxembourg  
  19. Malta  
  20. Netherlands  
  21. Poland  
  22. Portugal  
  23. Romania  
  24. Slovakia  
  25. Slovenia  
  26. Spain  
  27. Sweden  
* **The Post-Brexit Wildcard:**  
  * **United Kingdom:** Must be distinctly separate from the EU data bloc.  
* **The Geopolitical Focus:**  
  * **Ukraine:** Distinct data pull required due to CUFTA and recent trade shifts.  
* **Non-EU Strategic Partners (EFTA Bloc):**  
  * Switzerland  
  * Norway  
  * Iceland  
  * Liechtenstein

## **3\. The UI/UX Contract (Layout Rules)**

(Identical to the Indo-Pacific Build to ensure a seamless suite of tools)

### **The Global View (Always Visible)**

* **The 3D Globe:** Export lines flow from Canada to target European regions. Line thickness/brightness should correlate to total export value.  
* **The Master Timeline Slider:** The single source of truth for the application's state. Moving this updates *everything* else on the screen.  
* **The HUD (Heads Up Display):**  
  * **Cumulative Canadian Export Value (Total):** Canada's absolute total global exports (The entire pie).  
  * **Regional Diversification Value:** The total export value strictly for the countries displayed on this specific European map (The slice of the pie).  
  * **Sankey Graph:** Visualizing the dispersal percentages *within* that regional slice to the target European countries/blocs.

### **The Granular View (On-Demand)**

* **The Country Card:** Triggered by clicking a country on the globe.  
  * **The Uniformity Rule:** Every single selectable country on the map uses the exact same UI component and data structure. No exceptions.  
  * **Required Data Fields:**  
    * Total Export Value (for selected period)  
    * YoY or YTD Growth %  
    * Top 5 Export Commodities  
  * **Formatting Rule for Context:** Keep qualitative context short. Bullet points are better than paragraphs.  
  * **Crucial Element:** Trade deal notes/initiatives *must* include specific Month/Year dates to guide the user's slider interaction.

## **4\. The Data Engine (Logic & Harmonization)**

The data pipeline mirrors the Indo-Pacific build, maintaining strict harmonization.

* **Historical Data Phase (2021 \- 2025):**  
  * *Source:* StatsCan Annual Data.  
  * *Slider Behavior:* Slider snaps to whole years. Data displayed is total annual value.  
* **Current Tracking Phase (2026+):**  
  * *Source:* StatsCan Monthly Data.  
  * *Slider Behavior:* Slider snaps to monthly increments.  
  * *Math:* Visuals display Year-to-Date (YTD) cumulative values, compared against the identical YTD period of the previous year.  
* **Data Structure Goal:** A single, clean JSON payload per country, per time-period, combining StatsCan quantitative numbers with CIMT commodity data and our custom qualitative backgrounders.

## **5\. The Refinement Checklist**

1. **Does this serve the "Everyman"?**  
2. **Does this focus strictly on the Canadian domestic economy?**  
3. **Does this clutter the Global View?**  
4. **Does it answer the Core Question?**