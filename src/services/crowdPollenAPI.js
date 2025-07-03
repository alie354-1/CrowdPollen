// CrowdPollen API Service - Integrates with your Hugging Face model
class CrowdPollenAPI {
    constructor() {
        this.apiUrl = "https://alie354-crowdpollen.hf.space/api/predict";
        this.defaultConfidence = 0.25;
    }

    /**
     * Analyze pollen image using your Hugging Face model
     * @param {File|Blob} imageFile - The captured image
     * @param {number} confidence - Detection confidence threshold (0.1-0.9)
     * @returns {Promise<Object>} - Parsed analysis results
     */
    async analyzePollen(imageFile, confidence = this.defaultConfidence) {
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append("data", JSON.stringify([
                imageFile,  // The image file
                confidence  // Confidence threshold
            ]));
            
            // Make API request to your Hugging Face model
            const response = await fetch(this.apiUrl, {
                method: "POST",
                body: formData,
                // Don't set Content-Type - let browser set it for FormData
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            return this.parseResults(result);
            
        } catch (error) {
            console.error("Error calling pollen API:", error);
            throw new Error(`Pollen analysis failed: ${error.message}`);
        }
    }

    /**
     * Parse the API response into a standardized format
     * @param {Object} apiResponse - Raw API response
     * @returns {Object} - Parsed results
     */
    parseResults(apiResponse) {
        try {
            const data = apiResponse.data?.[2] || {};
            
            return {
                // Core results
                totalPollenCount: data.total_pollen_count || 0,
                densityLevel: this.normalizeDensityLevel(data.density_level),
                classBreakdown: data.class_breakdown || {},
                advice: data.advice || 'No specific advice available',
                detections: data.detections || [],
                confidence: data.model_confidence_threshold || this.defaultConfidence,
                
                // Additional data
                annotatedImage: apiResponse.data?.[0], // Base64 annotated image
                summary: apiResponse.data?.[1], // Formatted text summary
                
                // Processed data for UI
                pollenTypes: this.extractPollenTypes(data.class_breakdown || {}),
                riskLevel: this.calculateRiskLevel(data.total_pollen_count || 0),
                icon: this.getPollenIcon(data.density_level),
                color: this.getPollenColor(data.density_level)
            };
        } catch (error) {
            console.error("Error parsing API results:", error);
            throw new Error("Failed to parse analysis results");
        }
    }

    /**
     * Normalize density level to standard format
     */
    normalizeDensityLevel(level) {
        if (!level) return 'Unknown';
        
        const normalized = level.toLowerCase().trim();
        const mapping = {
            'low': 'Low',
            'moderate': 'Medium', 
            'medium': 'Medium',
            'high': 'High',
            'very high': 'Very High',
            'very_high': 'Very High'
        };
        
        return mapping[normalized] || level;
    }

    /**
     * Extract pollen types with counts > 0
     */
    extractPollenTypes(classBreakdown) {
        const types = [];
        for (const [type, count] of Object.entries(classBreakdown)) {
            if (count > 0) {
                types.push({
                    name: type.replace(/^Pollen Type \d+$/, `Type ${type.split(' ').pop()}`),
                    count: count,
                    originalName: type
                });
            }
        }
        return types.sort((a, b) => b.count - a.count);
    }

    /**
     * Calculate risk level based on total count
     */
    calculateRiskLevel(totalCount) {
        if (totalCount === 0) return 'None';
        if (totalCount <= 10) return 'Low';
        if (totalCount <= 30) return 'Medium';
        if (totalCount <= 60) return 'High';
        return 'Very High';
    }

    /**
     * Get appropriate icon for density level
     */
    getPollenIcon(level) {
        const icons = {
            'Low': '🌱',
            'Medium': '🌿', 
            'High': '🌻',
            'Very High': '🌋'
        };
        return icons[this.normalizeDensityLevel(level)] || '🌿';
    }

    /**
     * Get color for density level
     */
    getPollenColor(level) {
        const colors = {
            'Low': '#22c55e',      // green
            'Medium': '#f59e0b',   // orange
            'High': '#ef4444',     // red
            'Very High': '#991b1b' // dark red
        };
        return colors[this.normalizeDensityLevel(level)] || '#6b7280';
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            // Create a small test image (1x1 pixel)
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 1, 1);
            
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });
            
            const result = await this.analyzePollen(blob, 0.1);
            
            return {
                success: true,
                message: 'API connection successful',
                testResult: result
            };
        } catch (error) {
            return {
                success: false,
                message: `API connection failed: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * Get local pollen data for a specific location
     * @param {number} latitude - Location latitude
     * @param {number} longitude - Location longitude
     * @returns {Promise<Object>} - Local pollen data
     */
    async getLocalPollenData(latitude, longitude) {
        try {
            // Mock local data based on location and season
            const now = new Date();
            const month = now.getMonth(); // 0-11
            
            // Seasonal pollen patterns
            let baseLevel = 'Low';
            let mainType = 'Mixed';
            
            if (month >= 2 && month <= 5) { // Spring (Mar-Jun)
                baseLevel = 'High';
                mainType = 'Tree';
            } else if (month >= 6 && month <= 8) { // Summer (Jul-Sep)
                baseLevel = 'Medium';
                mainType = 'Grass';
            } else if (month >= 9 && month <= 10) { // Fall (Oct-Nov)
                baseLevel = 'Medium';
                mainType = 'Weed';
            }
            
            // Add some location-based variation
            const latVariation = Math.sin(latitude * Math.PI / 180) * 0.3;
            const lonVariation = Math.cos(longitude * Math.PI / 180) * 0.2;
            const variation = (latVariation + lonVariation) * 20;
            
            const baseCount = {
                'Low': 15,
                'Medium': 35,
                'High': 65
            }[baseLevel] || 25;
            
            const totalCount = Math.max(0, Math.round(baseCount + variation));
            
            return {
                location: {
                    latitude,
                    longitude,
                    address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                },
                current: {
                    totalPollenCount: totalCount,
                    densityLevel: this.calculateRiskLevel(totalCount),
                    mainPollenType: mainType,
                    lastUpdated: now.toISOString(),
                    conditions: {
                        temperature: Math.round(20 + Math.random() * 15), // 20-35°C
                        humidity: Math.round(40 + Math.random() * 40), // 40-80%
                        windSpeed: Math.round(5 + Math.random() * 15) // 5-20 km/h
                    }
                },
                forecast: this.generateLocalForecast(latitude, longitude),
                advice: this.getSeasonalAdvice(month, totalCount),
                icon: this.getPollenIcon(this.calculateRiskLevel(totalCount)),
                color: this.getPollenColor(this.calculateRiskLevel(totalCount))
            };
        } catch (error) {
            console.error('Error fetching local pollen data:', error);
            throw error;
        }
    }

    /**
     * Generate local forecast for next few days
     */
    generateLocalForecast(latitude, longitude) {
        const forecast = [];
        const now = new Date();
        
        for (let i = 1; i <= 5; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() + i);
            
            const variation = Math.random() * 0.4 - 0.2; // ±20% variation
            const baseCount = 25 + (Math.sin(latitude * Math.PI / 180) * 15);
            const count = Math.max(0, Math.round(baseCount * (1 + variation)));
            
            forecast.push({
                date: date.toISOString().split('T')[0],
                totalPollenCount: count,
                densityLevel: this.calculateRiskLevel(count),
                mainType: this.getSeasonalMainType(date.getMonth()),
                conditions: {
                    temperature: Math.round(18 + Math.random() * 20),
                    humidity: Math.round(35 + Math.random() * 50),
                    windSpeed: Math.round(3 + Math.random() * 20)
                }
            });
        }
        
        return forecast;
    }

    /**
     * Get seasonal main pollen type
     */
    getSeasonalMainType(month) {
        if (month >= 2 && month <= 5) return 'Tree';
        if (month >= 6 && month <= 8) return 'Grass';
        if (month >= 9 && month <= 10) return 'Weed';
        return 'Mixed';
    }

    /**
     * Get seasonal advice
     */
    getSeasonalAdvice(month, count) {
        let advice = '';
        
        if (month >= 2 && month <= 5) { // Spring
            advice = 'Spring tree pollen season is active. ';
        } else if (month >= 6 && month <= 8) { // Summer
            advice = 'Summer grass pollen season. ';
        } else if (month >= 9 && month <= 10) { // Fall
            advice = 'Fall weed pollen season. ';
        } else {
            advice = 'Winter season - generally lower pollen levels. ';
        }
        
        if (count > 50) {
            advice += 'High pollen levels detected. Consider staying indoors during peak hours and taking allergy medication if needed.';
        } else if (count > 25) {
            advice += 'Moderate pollen levels. Sensitive individuals should take precautions.';
        } else {
            advice += 'Low pollen levels. Good conditions for outdoor activities.';
        }
        
        return advice;
    }

    /**
     * Get national pollen data (mock implementation for now)
     */
    async getNationalPollenData() {
        try {
            // Mock national data - replace with real API when available
            return {
                nationalAverage: 'Medium',
                regions: [
                    { name: 'Northeast', level: 'High', count: 45 },
                    { name: 'Southeast', level: 'Very High', count: 78 },
                    { name: 'Midwest', level: 'Medium', count: 32 },
                    { name: 'Southwest', level: 'Low', count: 15 },
                    { name: 'West', level: 'Medium', count: 28 }
                ],
                lastUpdated: new Date().toISOString(),
                trend: 'increasing'
            };
        } catch (error) {
            console.error('Error fetching national pollen data:', error);
            throw error;
        }
    }

    /**
     * Get formatted advice based on results
     */
    getFormattedAdvice(results) {
        const { totalPollenCount, densityLevel, pollenTypes } = results;
        
        let advice = results.advice;
        
        // Add specific recommendations based on count and types
        if (totalPollenCount > 30) {
            advice += "\n\n• Consider staying indoors during peak hours (10 AM - 4 PM)";
            advice += "\n• Keep windows closed and use air conditioning";
        }
        
        if (pollenTypes.length > 0) {
            const mainType = pollenTypes[0].name;
            advice += `\n• Primary pollen type detected: ${mainType}`;
        }
        
        if (densityLevel === 'High' || densityLevel === 'Very High') {
            advice += "\n• Take allergy medication if prescribed";
            advice += "\n• Shower and change clothes after being outside";
        }
        
        return advice;
    }
}

// Export for use in other modules
window.CrowdPollenAPI = CrowdPollenAPI;

// Create global instance
window.crowdPollenAPI = new CrowdPollenAPI();

// ES6 exports for module imports
export { CrowdPollenAPI };
export const crowdPollenAPI = new CrowdPollenAPI();
export default crowdPollenAPI;
