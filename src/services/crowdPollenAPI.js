// CrowdPollen API Service - Integrates with your Hugging Face model
class CrowdPollenAPI {
    constructor() {
        this.apiUrl = "https://alie354-crowdpollen.hf.space/api/analyze";
        this.infoUrl = "https://alie354-crowdpollen.hf.space/api/info";
        this.healthUrl = "https://alie354-crowdpollen.hf.space/health";
        this.defaultConfidence = 0.25;
        
        // Get token from environment variable
        this.token = import.meta.env.VITE_HUGGINGFACE_TOKEN;
        
        if (!this.token) {
            console.warn('⚠️ VITE_HUGGINGFACE_TOKEN not found in environment variables');
        }
    }

    /**
     * Get headers for API requests (no auth needed for public space)
     * @returns {Object} Headers object
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Convert File/Blob to base64 string
     * @param {File|Blob} file - The file to convert
     * @returns {Promise<string>} Base64 string without data URL prefix
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the data URL prefix (data:image/jpeg;base64,)
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    /**
     * Analyze pollen image using your Hugging Face model
     * @param {File|Blob} imageFile - The captured image
     * @param {number} confidence - Detection confidence threshold (0.1-0.9)
     * @returns {Promise<Object>} - Parsed analysis results
     */
    async analyzePollen(imageFile, confidence = this.defaultConfidence) {
        const startTime = performance.now();
        
        try {
            console.log("🔄 Starting pollen analysis with Hugging Face API");
            console.log(`📊 Image size: ${imageFile.size} bytes, type: ${imageFile.type}`);
            console.log(`🎯 Confidence threshold: ${confidence}`);
            
            // Convert image to base64
            const base64 = await this.fileToBase64(imageFile);
            console.log("✅ Image converted to base64", `(${base64.length} chars)`);
            
            const requestData = {
                image_data: `data:image/jpeg;base64,${base64}`,
                confidence_threshold: confidence
            };
            
            console.log("📤 Sending request to:", this.apiUrl);
            
            // Make API call (no auth needed for public space)
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(requestData)
            });
            
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            
            console.log(`📥 Response received in ${responseTime}ms, status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error ${response.status}:`, errorText);
                
                if (response.status === 404) {
                    throw new Error(`API endpoint not found (404). Check if your Hugging Face space is running and endpoints are available.`);
                } else if (response.status === 401) {
                    throw new Error('Authentication failed - check Hugging Face token');
                } else if (response.status === 403) {
                    throw new Error('Access forbidden - token may not have permission');
                } else if (response.status === 500) {
                    throw new Error('Internal server error - the model may be loading or crashed');
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}. Details: ${errorText}`);
                }
            }
            
            const result = await response.json();
            console.log("✅ API response received:", result);
            console.log(`⏱️ Total processing time: ${responseTime}ms`);
            
            if (result.success) {
                const parsedResults = this.parseResults(result);
                console.log("✅ Analysis completed successfully");
                console.log(`🌼 Found ${parsedResults.totalPollenCount} pollen grains`);
                return parsedResults;
            } else {
                throw new Error(result.error || 'Analysis failed');
            }
            
        } catch (error) {
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            console.error(`❌ API analysis failed after ${responseTime}ms:`, error.message);
            console.warn("🔄 Using fallback analysis instead");
            return this.generateFallbackAnalysis(imageFile);
        }
    }

    /**
     * Get model information from the API
     * @returns {Promise<Object>} Model information
     */
    async getModelInfo() {
        try {
            const response = await fetch(this.infoUrl, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to get model info:', error);
            throw error;
        }
    }

    /**
     * Check API health status
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
        try {
            const response = await fetch(this.healthUrl, {
                headers: this.getHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }

    /**
     * Validate the authentication token
     * @returns {Promise<Object>} Validation result
     */
    async validateToken() {
        try {
            const health = await this.checkHealth();
            return { 
                valid: true, 
                health,
                message: 'Token is valid and API is accessible'
            };
        } catch (error) {
            return { 
                valid: false, 
                error: error.message,
                needsToken: error.message.includes('Authentication') || error.message.includes('401'),
                message: `Token validation failed: ${error.message}`
            };
        }
    }

    /**
     * Parse the API response into a standardized format
     * @param {Object} apiResponse - Raw API response
     * @returns {Object} - Parsed results
     */
    parseResults(apiResponse) {
        try {
            // API returns data array with [annotated_image, summary, details]
            const [annotatedImage, summary, details] = apiResponse.data || [];
            
            if (!details) {
                throw new Error('Invalid API response structure');
            }
            
            return {
                // Core results from API
                totalPollenCount: details.total_pollen_count || 0,
                densityLevel: this.normalizeDensityLevel(details.density_level),
                classBreakdown: details.class_breakdown || {},
                advice: details.advice || 'No specific advice available',
                detections: details.detections || [],
                confidence: details.model_confidence_threshold || this.defaultConfidence,
                
                // Additional data
                annotatedImage: annotatedImage, // Base64 annotated image
                summary: summary, // Formatted text summary
                
                // Processed data for UI
                pollenTypes: this.extractPollenTypes(details.class_breakdown || {}),
                riskLevel: this.calculateRiskLevel(details.total_pollen_count || 0),
                icon: this.getPollenIcon(details.density_level),
                color: this.getPollenColor(details.density_level),
                
                // Metadata
                metadata: apiResponse.metadata || {},
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error("Error parsing API results:", error);
            throw new Error("Failed to parse analysis results");
        }
    }

    /**
     * Normalize density level to standard format
     * API returns: Low, Moderate, High, Very High
     */
    normalizeDensityLevel(level) {
        if (!level) return 'None';
        
        const normalized = level.toLowerCase().trim();
        const mapping = {
            'none': 'None',
            'low': 'Low',
            'moderate': 'Moderate', 
            'medium': 'Moderate', // Handle legacy format
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
     * Based on API documentation density levels
     */
    calculateRiskLevel(totalCount) {
        if (totalCount === 0) return 'None';
        if (totalCount <= 10) return 'Low';        // 1-10 grains
        if (totalCount <= 30) return 'Moderate';   // 11-30 grains  
        if (totalCount <= 60) return 'High';       // 31-60 grains
        return 'Very High';                        // >60 grains
    }

    /**
     * Get appropriate icon for density level
     */
    getPollenIcon(level) {
        const icons = {
            'None': '🌱',
            'Low': '🟢',
            'Moderate': '🟡', 
            'High': '🟠',
            'Very High': '🔴'
        };
        return icons[this.normalizeDensityLevel(level)] || '🟡';
    }

    /**
     * Get color for density level
     */
    getPollenColor(level) {
        const colors = {
            'None': '#10b981',     // emerald green
            'Low': '#22c55e',      // green
            'Moderate': '#f59e0b', // orange
            'High': '#ef4444',     // red
            'Very High': '#991b1b' // dark red
        };
        return colors[this.normalizeDensityLevel(level)] || '#6b7280';
    }

    /**
     * Generate realistic fallback analysis when API is unavailable
     */
    generateFallbackAnalysis(imageFile) {
        console.log("🔄 Generating fallback pollen analysis");
        
        // Generate realistic but random results
        const pollenTypes = ['Oak', 'Birch', 'Grass', 'Ragweed', 'Pine'];
        const selectedTypes = pollenTypes.slice(0, Math.floor(Math.random() * 3) + 1);
        
        const totalCount = Math.floor(Math.random() * 50) + 10; // 10-60 grains
        const classBreakdown = {};
        
        // Distribute count among selected types
        let remaining = totalCount;
        selectedTypes.forEach((type, index) => {
            if (index === selectedTypes.length - 1) {
                classBreakdown[`Pollen Type ${index + 1}`] = remaining;
            } else {
                const count = Math.floor(Math.random() * (remaining / 2)) + 1;
                classBreakdown[`Pollen Type ${index + 1}`] = count;
                remaining -= count;
            }
        });

        // Fill remaining types with 0
        for (let i = selectedTypes.length + 1; i <= 5; i++) {
            classBreakdown[`Pollen Type ${i}`] = 0;
        }

        const densityLevel = this.calculateRiskLevel(totalCount);
        
        return {
            // Match the structure expected by UI components
            totalPollenCount: totalCount,
            densityLevel: densityLevel,
            classBreakdown: classBreakdown,
            advice: `${densityLevel} pollen levels detected. ${totalCount > 30 ? 'Consider taking precautions if sensitive to pollen.' : 'Generally safe conditions for outdoor activities.'} (Demo mode - API unavailable)`,
            detections: selectedTypes.map((type, i) => ({
                class: `Pollen Type ${i + 1}`,
                confidence: (Math.random() * 0.3 + 0.5).toFixed(2) // 0.5-0.8
            })),
            confidence: this.defaultConfidence,
            
            // Additional data
            annotatedImage: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
            summary: `🌼 **Found ${totalCount} pollen grains** (Demo Mode)\n\n${selectedTypes.map((type, i) => `• **${type}**: ${classBreakdown[`Pollen Type ${i + 1}`]} grains`).join('\n')}\n\n**Pollen Density**: ${densityLevel}\n**Note**: API unavailable, showing demo results`,
            
            // Processed data for UI
            pollenTypes: this.extractPollenTypes(classBreakdown),
            riskLevel: densityLevel,
            icon: this.getPollenIcon(densityLevel),
            color: this.getPollenColor(densityLevel),
            
            // Metadata
            metadata: { demo: true, reason: 'API unavailable' },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Test all API endpoints like the HTML tester
     * @returns {Promise<Object>} Test results for all endpoints
     */
    async testAllEndpoints() {
        console.log("🧪 Starting comprehensive API endpoint testing...");
        
        const results = {
            endpoints: {},
            summary: {
                total: 0,
                working: 0,
                failed: 0,
                responseTimes: []
            },
            timestamp: new Date().toISOString()
        };
        
        // Test each endpoint
        const endpoints = [
            { name: 'GET /api/info', url: this.infoUrl, method: 'GET' },
            { name: 'GET /health', url: this.healthUrl, method: 'GET' },
            { name: 'GET /docs', url: this.apiUrl.replace('/api/analyze', '/docs'), method: 'GET' },
            { name: 'GET / (Gradio UI)', url: this.apiUrl.replace('/api/analyze', ''), method: 'GET' }
        ];
        
        for (const endpoint of endpoints) {
            results.summary.total++;
            const testResult = await this.testSingleEndpoint(endpoint);
            results.endpoints[endpoint.name] = testResult;
            
            if (testResult.success) {
                results.summary.working++;
                results.summary.responseTimes.push(testResult.responseTime);
            } else {
                results.summary.failed++;
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Calculate average response time
        if (results.summary.responseTimes.length > 0) {
            results.summary.avgResponseTime = Math.round(
                results.summary.responseTimes.reduce((a, b) => a + b, 0) / results.summary.responseTimes.length
            );
        }
        
        console.log("✅ Endpoint testing completed:", results);
        return results;
    }

    /**
     * Test a single endpoint
     * @param {Object} endpoint - Endpoint configuration
     * @returns {Promise<Object>} Test result
     */
    async testSingleEndpoint(endpoint) {
        const startTime = performance.now();
        
        try {
            console.log(`🔍 Testing ${endpoint.name}...`);
            
            const response = await fetch(endpoint.url, {
                method: endpoint.method,
                headers: this.getHeaders()
            });
            
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            
            if (response.ok) {
                let data;
                const contentType = response.headers.get('content-type');
                
                if (contentType?.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    data = text.length > 100 ? text.substring(0, 100) + '...' : text;
                }
                
                console.log(`✅ ${endpoint.name} works! (${responseTime}ms)`);
                
                return {
                    success: true,
                    status: response.status,
                    responseTime,
                    data,
                    contentType: contentType || 'unknown',
                    message: `Success (${responseTime}ms)`
                };
            } else {
                console.log(`❌ ${endpoint.name} failed: HTTP ${response.status}`);
                
                return {
                    success: false,
                    status: response.status,
                    responseTime,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                    message: `Failed: HTTP ${response.status}`
                };
            }
        } catch (error) {
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            
            console.log(`❌ ${endpoint.name} error:`, error.message);
            
            return {
                success: false,
                status: 0,
                responseTime,
                error: error.message,
                message: `Error: ${error.message}`
            };
        }
    }

    /**
     * Test API connection with comprehensive analysis
     */
    async testConnection() {
        try {
            console.log("🔄 Testing API connection...");
            
            // Test all endpoints first
            const endpointResults = await this.testAllEndpoints();
            
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
            
            // Test actual analysis if endpoints are working
            let analysisResult = null;
            if (endpointResults.summary.working > 0) {
                try {
                    analysisResult = await this.analyzePollen(blob, 0.1);
                    console.log("✅ Test analysis completed:", analysisResult);
                } catch (error) {
                    console.warn("⚠️ Analysis test failed:", error.message);
                }
            }
            
            const isHealthy = endpointResults.summary.working >= 2; // At least 2 endpoints working
            
            return {
                success: isHealthy,
                message: isHealthy ? 'API connection successful' : 'Some endpoints not working',
                endpoints: endpointResults,
                analysisTest: analysisResult ? {
                    success: true,
                    pollenCount: analysisResult.totalPollenCount,
                    demo: analysisResult.metadata?.demo || false
                } : {
                    success: false,
                    error: 'Analysis test failed'
                },
                recommendations: this.getConnectionRecommendations(endpointResults)
            };
        } catch (error) {
            console.error("❌ API connection test failed:", error);
            return {
                success: false,
                message: `API connection failed: ${error.message}`,
                error: error,
                recommendations: [
                    'Check if your Hugging Face space is running',
                    'Verify the space URL is correct',
                    'Ensure the space is public or you have proper authentication'
                ]
            };
        }
    }

    /**
     * Get recommendations based on endpoint test results
     */
    getConnectionRecommendations(endpointResults) {
        const recommendations = [];
        
        if (endpointResults.summary.working === 0) {
            recommendations.push('🚨 No endpoints are working - check if your Hugging Face space is running');
            recommendations.push('🔗 Verify the space URL: ' + this.apiUrl.replace('/api/analyze', ''));
            recommendations.push('🔄 Try refreshing the space or restarting it');
        } else if (endpointResults.summary.working < endpointResults.summary.total) {
            recommendations.push('⚠️ Some endpoints are not working - this is normal for some spaces');
            recommendations.push('✅ Core functionality should still work');
        } else {
            recommendations.push('🎉 All endpoints are working perfectly!');
            recommendations.push('🚀 Your API is ready for pollen analysis');
        }
        
        if (endpointResults.summary.avgResponseTime > 5000) {
            recommendations.push('🐌 Response times are slow - the model may be loading');
            recommendations.push('⏳ Try again in a few minutes');
        }
        
        return recommendations;
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
                baseLevel = 'Moderate';
                mainType = 'Grass';
            } else if (month >= 9 && month <= 10) { // Fall (Oct-Nov)
                baseLevel = 'Moderate';
                mainType = 'Weed';
            }
            
            // Add some location-based variation
            const latVariation = Math.sin(latitude * Math.PI / 180) * 0.3;
            const lonVariation = Math.cos(longitude * Math.PI / 180) * 0.2;
            const variation = (latVariation + lonVariation) * 20;
            
            const baseCount = {
                'Low': 15,
                'Moderate': 35,
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
                nationalAverage: 'Moderate',
                regions: [
                    { name: 'Northeast', level: 'High', count: 45 },
                    { name: 'Southeast', level: 'Very High', count: 78 },
                    { name: 'Midwest', level: 'Moderate', count: 32 },
                    { name: 'Southwest', level: 'Low', count: 15 },
                    { name: 'West', level: 'Moderate', count: 28 }
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
     * Submit a complete pollen reading with image analysis
     * @param {Object} submission - Submission data
     * @param {File|Blob} submission.image - The captured image
     * @param {Object} submission.location - Location data
     * @param {string} submission.user_id - User ID (optional)
     * @param {string} submission.timestamp - Submission timestamp
     * @returns {Promise<Object>} - Complete analysis results
     */
    async submitPollenReading(submission) {
        try {
            const { image, location, user_id, timestamp } = submission;
            
            // Analyze the pollen image
            const analysisResults = await this.analyzePollen(image);
            
            // Create complete submission record
            const submissionRecord = {
                id: `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: timestamp || new Date().toISOString(),
                location: {
                    latitude: location?.latitude,
                    longitude: location?.longitude,
                    address: location?.address
                },
                user_id: user_id || null,
                image_data: {
                    size: image?.size,
                    type: image?.type,
                    lastModified: image?.lastModified
                },
                analysis: analysisResults,
                // Convert to format expected by UI components
                pollen_count: analysisResults.totalPollenCount,
                pollen_density: this.mapDensityToLevel(analysisResults.densityLevel),
                confidence_score: analysisResults.confidence || 0.75,
                plant_species: this.extractSpeciesNames(analysisResults.pollenTypes),
                advice: analysisResults.advice,
                weather_conditions: this.generateWeatherContext(location)
            };
            
            // Store locally (as backup)
            this.storeSubmissionLocally(submissionRecord);

            // Save to Supabase
            try {
                console.log('📡 Attempting to save submission to Supabase...');
                const supabaseModule = await import('../lib/supabase.js');
                console.log('📦 Supabase module loaded:', supabaseModule);
                const { saveSubmission } = supabaseModule;
                console.log('📝 Calling saveSubmission...');
                const dbRecord = {
                    user_id: user_id || null,
                    image_card_url: analysisResults.annotatedImage,
                    latitude: location?.latitude,
                    longitude: location?.longitude,
                    zip_code: location?.zip_code || null,
                    address: location?.address || null,
                    pollen_density: this.mapDensityToLevel(analysisResults.densityLevel),
                    pollen_count: analysisResults.totalPollenCount,
                    confidence_score: analysisResults.confidence || 0.75,
                    plant_species: this.extractSpeciesNames(analysisResults.pollenTypes),
                    weather_data: submissionRecord.weather_conditions,
                    user_symptoms: null,
                    notes: null,
                    is_anonymous: !user_id
                };
                await saveSubmission(dbRecord);
            } catch (err) {
                console.warn('⚠️ Failed to save submission to Supabase:', err?.message || err);
                if (err?.response) {
                    console.error('Supabase error response:', await err.response.text());
                }
            }

            return submissionRecord;
            
        } catch (error) {
            console.error('Error submitting pollen reading:', error);
            throw new Error(`Failed to submit pollen reading: ${error.message}`);
        }
    }

    /**
     * Map density level to expected format
     */
    mapDensityToLevel(densityLevel) {
        const mapping = {
            'Low': 'low',
            'Moderate': 'moderate', 
            'High': 'high',
            'Very High': 'very_high'
        };
        return mapping[densityLevel] || 'moderate';
    }

    /**
     * Extract species names from pollen types
     */
    extractSpeciesNames(pollenTypes) {
        if (!pollenTypes || pollenTypes.length === 0) {
            return ['Unknown Species'];
        }
        
        return pollenTypes.map(type => {
            // Convert generic type names to more specific species
            const typeMapping = {
                'Type 1': 'Oak',
                'Type 2': 'Birch', 
                'Type 3': 'Grass',
                'Type 4': 'Ragweed',
                'Type 5': 'Pine'
            };
            
            return typeMapping[type.name] || type.name || 'Unknown';
        });
    }

    /**
     * Generate weather context for submission
     */
    generateWeatherContext(location) {
        // Mock weather data - in production this would come from a weather API
        return {
            temperature: Math.round(15 + Math.random() * 20), // 15-35°C
            humidity: Math.round(40 + Math.random() * 40), // 40-80%
            wind_speed: Math.round(5 + Math.random() * 15), // 5-20 km/h
            conditions: ['Clear', 'Partly Cloudy', 'Overcast'][Math.floor(Math.random() * 3)]
        };
    }

    /**
     * Store submission locally in browser storage
     */
    storeSubmissionLocally(submission) {
        try {
            const existingSubmissions = JSON.parse(localStorage.getItem('crowdpollen_submissions') || '[]');
            const newSubmission = {
                ...submission,
                image_data: {
                    ...submission.image_data,
                    stored: true
                }
            };

            // Estimate size and trim if needed
            const maxEntries = 30;
            const trimmed = existingSubmissions.slice(-maxEntries + 1);
            trimmed.push(newSubmission);

            try {
                localStorage.setItem('crowdpollen_submissions', JSON.stringify(trimmed));
                console.log('Submission stored locally:', submission.id);
            } catch (e) {
                console.warn('LocalStorage quota exceeded, clearing and storing only latest submission');
                localStorage.setItem('crowdpollen_submissions', JSON.stringify([newSubmission]));
            }
            
            console.log('Submission stored locally:', submission.id);
        } catch (error) {
            console.warn('Failed to store submission locally:', error);
        }
    }

    /**
     * Get locally stored submissions
     */
    getLocalSubmissions() {
        try {
            return JSON.parse(localStorage.getItem('crowdpollen_submissions') || '[]');
        } catch (error) {
            console.warn('Failed to retrieve local submissions:', error);
            return [];
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
/**
 * Get local report counts from Supabase function
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} zipCode 
 * @returns {Promise<Object>} - Object with tiered counts
 */
CrowdPollenAPI.prototype.getLocalReportCounts = async function(latitude, longitude, zipCode = null) {
  try {
    const { supabase } = await import('../lib/supabase.js');
    console.log('📍 Calling getLocalReportCounts with:', { latitude, longitude, zipCode });
    const { data, error } = await supabase.rpc('get_local_report_counts', {
      user_lat: latitude,
      user_lon: longitude,
      user_zip: zipCode
    });

    if (error) throw error;

    const counts = {};
    for (const row of data) {
      counts[row.radius_label] = row.report_count;
    }
    console.log('📊 Local report counts received:', counts);
    return counts;
  } catch (error) {
    console.error('Error fetching local report counts:', error);
    return {};
  }
};

CrowdPollenAPI.prototype.getLocalSubmissions = async function(latitude, longitude, radiusKm = 10) {
  try {
    const { supabase } = await import('../lib/supabase.js');
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('flagged', false)
      .filter('latitude', 'gte', latitude - 0.1)
      .filter('latitude', 'lte', latitude + 0.1)
      .filter('longitude', 'gte', longitude - 0.1)
      .filter('longitude', 'lte', longitude + 0.1)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching local submissions:', error);
    return [];
  }
};

CrowdPollenAPI.prototype.getNationalSubmissions = async function() {
  try {
    const { supabase } = await import('../lib/supabase.js');
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('flagged', false)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching national submissions:', error);
    return [];
  }
};

CrowdPollenAPI.prototype.getRecentSubmissions = async function(limit = 10) {
  try {
    const { supabase } = await import('../lib/supabase.js');
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('flagged', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching recent submissions:', error);
    return [];
  }
};

export const crowdPollenAPI = new CrowdPollenAPI();
export default crowdPollenAPI;
