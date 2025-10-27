# NBL Data Visualization Description

## i. Domain, Why, and Who

This visualization focuses on the **National Basketball League (NBL) 2024-25 season**, Australia's premier professional basketball competition. The domain encompasses geographic team distribution across Australia and New Zealand, alongside comprehensive player statistical analysis.

**Why**: Basketball fans, analysts, coaches, and team management require tools to understand team geographic distribution and compare player performances across multiple statistical dimensions to inform strategic decisions, identify talent, and analyze playing patterns.

**Who**: The target users include basketball enthusiasts seeking deeper insights into the NBL, sports analysts conducting performance evaluations, coaches comparing player capabilities, and team managers assessing regional representation and player contributions across various statistical categories.

## ii. What: The Data

The visualization utilizes **NBL 2024-25 season player statistics** comprising 25 attributes per player, including games played, shooting percentages, field goal attempts, three-point statistics, effective field goal percentage, free throws, rebounds, assists, steals, blocks, turnovers, fouls, and total points. The dataset was sourced from official NBL statistics and processed through custom Python scripts to create clean, structured CSV data.

**Geographic data** integrates Natural Earth administrative boundary data (ne_10m_admin_1_states_provinces) to render Australia and New Zealand regions. Team location coordinates were mapped to major cities, and state-level team statistics were calculated to create the choropleth representation.

The data creation process involved: (1) extracting raw NBL statistics, (2) geocoding team locations to coordinates, (3) aggregating state-level team distributions, (4) normalizing statistical ranges for meaningful comparative analysis across different metrics.

## iii. How: Idioms and Rationale

**Choropleth Map with Proportional Circles**: The map employs a geographic idiom to visualize team distribution across Australia and New Zealand. Regions are color-coded by team count (0-2 teams), while circular markers positioned at precise coordinates identify individual teams with labels. This spatial representation enables users to instantly understand the NBL's geographic coverage and regional balance. The **clickable interaction** allows users to filter data by state, team, or geographic marker, creating an intuitive geographic navigation system.

**Interactive Data Table**: Player statistics are presented in a sortable table with 25 columns covering all major basketball metrics. Users can sort by any column to identify top performers in specific categories, facilitating efficient data exploration and analysis. Clicking the map automatically updates the table to show only selected team's players.

**Dual Radar Charts**: For comparative player analysis, **normalized radar charts** are deployed side-by-side. Each chart displays 9 key metrics (Games, FGA, FG%, 3PA, 3P%, eFG%, FT, FT%, Points) normalized to a 5-level scale (0-4). This normalization is crucial because metrics have vastly different magnitudes—percentages versus counts—and enables fair comparisons across diverse statistical types. The dual-view design allows direct side-by-side comparison of player strengths and weaknesses, with visual differentiation through color-coding (red for Player 1, blue for Player 2).

**Custom Features**: (1) **Automatic normalization** scales each statistic to a 0-4 range based on dataset min/max values, ensuring comparative validity; (2) **Linked interactions** where map clicks update both team selection and player availability; (3) **Dynamic player selection** that refreshes available options when teams change; (4) **Responsive layout** supporting side-by-side player comparison.

These idioms collectively support tasks including geographic team analysis, statistical exploration, player-to-player comparisons, and identifying top performers across various categories. The visualization transforms complex multidimensional data into an accessible, interactive analytical tool.

