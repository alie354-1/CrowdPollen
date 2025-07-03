// CROWDPOLLEN API INTEGRATION GUIDE
// How to use your Hugging Face pollen detector API

// ============================================================================
// METHOD 1: JavaScript/React Web App Integration
// ============================================================================

/**
 * Upload image to your pollen detector and get results
 * @param {File} imageFile - The image file from user upload
 * @param {number} confidence - Detection confidence (0.1-0.9, default 0.25)
 * @returns {Promise} - Pollen detection results
 */
async function analyzePollen(imageFile, confidence = 0.25) {
    try {
        // Your Hugging Face API endpoint
        const API_URL = "https://alie354-crowdpollen.hf.space/api/predict";
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("data", JSON.stringify([
            imageFile,  // The image file
            confidence  // Confidence threshold
        ]));
        
        // Make API request
        const response = await fetch(API_URL, {
            method: "POST",
            body: formData,
            headers: {
                // Don't set Content-Type - let browser set it for FormData
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error("Error calling pollen API:", error);
        throw error;
    }
}

// ============================================================================
// METHOD 2: Alternative Gradio Client Approach
// ============================================================================

/**
 * Alternative method using Gradio client format
 */
async function analyzePollenGradio(imageFile, confidence = 0.25) {
    const API_URL = "https://alie354-crowdpollen.hf.space/call/analyze_pollen";
    
    try {
        // Convert image to base64 or blob URL
        const imageData = await fileToDataURL(imageFile);
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: [imageData, confidence]
            })
        });
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error("Gradio API error:", error);
        throw error;
    }
}

// Helper function to convert file to data URL
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================================================
// REACT COMPONENT EXAMPLE
// ============================================================================

import React, { useState } from 'react';

function PollenAnalyzer() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedImage(file);
            setResults(null);
            setError(null);
        }
    };

    const analyzeImage = async () => {
        if (!selectedImage) return;

        setLoading(true);
        setError(null);

        try {
            // Call your pollen detector API
            const result = await analyzePollen(selectedImage, 0.25);
            
            // Parse the results
            const processedResults = {
                totalPollenCount: result.data?.[2]?.total_pollen_count || 0,
                densityLevel: result.data?.[2]?.density_level || 'Unknown',
                classBreakdown: result.data?.[2]?.class_breakdown || {},
                advice: result.data?.[2]?.advice || 'No advice available',
                detections: result.data?.[2]?.detections || []
            };
            
            setResults(processedResults);
            
        } catch (err) {
            setError(`Analysis failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pollen-analyzer">
            <h2>🌼 CrowdPollen Analysis</h2>
            
            {/* Image Upload */}
            <div className="upload-section">
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    disabled={loading}
                />
                
                {selectedImage && (
                    <div>
                        <img 
                            src={URL.createObjectURL(selectedImage)} 
                            alt="Selected" 
                            style={{maxWidth: '300px', maxHeight: '300px'}}
                        />
                        <br />
                        <button 
                            onClick={analyzeImage} 
                            disabled={loading}
                            className="analyze-btn"
                        >
                            {loading ? '🔄 Analyzing...' : '🔬 Analyze Pollen'}
                        </button>
                    </div>
                )}
            </div>

            {/* Results Display */}
            {results && (
                <div className="results-section">
                    <h3>📊 Analysis Results</h3>
                    <div className="result-card">
                        <p><strong>Total Pollen Count:</strong> {results.totalPollenCount}</p>
                        <p><strong>Density Level:</strong> {results.densityLevel}</p>
                        <p><strong>Recommendation:</strong> {results.advice}</p>
                        
                        <h4>Pollen Types Detected:</h4>
                        <ul>
                            {Object.entries(results.classBreakdown).map(([type, count]) => (
                                count > 0 && (
                                    <li key={type}>
                                        {type}: {count} grains
                                    </li>
                                )
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="error-section" style={{color: 'red'}}>
                    ❌ {error}
                </div>
            )}
        </div>
    );
}

export default PollenAnalyzer;

// ============================================================================
// VANILLA JAVASCRIPT EXAMPLE (for simple HTML pages)
// ============================================================================

// HTML:
// <input type="file" id="imageInput" accept="image/*">
// <button onclick="analyzePollenSimple()">Analyze Pollen</button>
// <div id="results"></div>

async function analyzePollenSimple() {
    const imageInput = document.getElementById('imageInput');
    const resultsDiv = document.getElementById('results');
    
    if (!imageInput.files[0]) {
        alert('Please select an image first');
        return;
    }
    
    resultsDiv.innerHTML = '🔄 Analyzing pollen...';
    
    try {
        const result = await analyzePollen(imageInput.files[0]);
        
        // Display results
        const data = result.data?.[2] || {};
        resultsDiv.innerHTML = `
            <h3>📊 Pollen Analysis Results</h3>
            <p><strong>Total Pollen:</strong> ${data.total_pollen_count || 0} grains</p>
            <p><strong>Density:</strong> ${data.density_level || 'Unknown'}</p>
            <p><strong>Advice:</strong> ${data.advice || 'No advice'}</p>
        `;
        
    } catch (error) {
        resultsDiv.innerHTML = `❌ Error: ${error.message}`;
    }
}

// ============================================================================
// EXPECTED API RESPONSE FORMAT
// ============================================================================

/*
Your API will return data in this format:

{
    "data": [
        null,  // Annotated image (base64)
        "🌼 **Found 23 pollen grains**\n\n• **Pollen Type 1**: 8 grains\n• **Pollen Type 3**: 15 grains\n\n**Pollen Density**: 🟡 Moderate\n**Recommendation**: Consider precautions if sensitive to pollen",
        {
            "total_pollen_count": 23,
            "class_breakdown": {
                "Pollen Type 1": 8,
                "Pollen Type 2": 0,
                "Pollen Type 3": 15,
                "Pollen Type 4": 0,
                "Pollen Type 5": 0
            },
            "density_level": "Moderate",
            "detections": [
                {
                    "class": "Pollen Type 1",
                    "confidence": "0.67"
                },
                {
                    "class": "Pollen Type 3", 
                    "confidence": "0.82"
                }
                // ... more detections
            ],
            "model_confidence_threshold": 0.25,
            "advice": "Consider precautions if sensitive to pollen"
        }
    ]
}
*/

// ============================================================================
// INTEGRATION INTO YOUR CROWDPOLLEN WEB APP
// ============================================================================

/**
 * Full CrowdPollen integration example
 */
class CrowdPollenAPI {
    constructor() {
        this.apiUrl = "https://alie354-crowdpollen.hf.space/api/predict";
        this.defaultConfidence = 0.25;
    }
    
    async submitPollenReport(imageFile, location, userNotes = '') {
        try {
            // 1. Analyze the pollen image
            const analysisResult = await analyzePollen(imageFile, this.defaultConfidence);
            const pollenData = analysisResult.data?.[2] || {};
            
            // 2. Prepare submission data
            const submission = {
                timestamp: new Date().toISOString(),
                location: location, // {lat, lng, address}
                pollenAnalysis: {
                    totalCount: pollenData.total_pollen_count || 0,
                    densityLevel: pollenData.density_level || 'Unknown',
                    typeBreakdown: pollenData.class_breakdown || {},
                    confidence: pollenData.model_confidence_threshold,
                    advice: pollenData.advice
                },
                userNotes: userNotes,
                imageAnalyzed: true
            };
            
            // 3. Save to your database (replace with your backend API)
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submission)
            });
            
            return {
                success: true,
                submission: submission,
                analysisResult: pollenData
            };
            
        } catch (error) {
            console.error('Submission failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Usage in your app:
const crowdPollen = new CrowdPollenAPI();

// When user submits a pollen report:
async function handlePollenSubmission(imageFile, userLocation, notes) {
    const result = await crowdPollen.submitPollenReport(imageFile, userLocation, notes);
    
    if (result.success) {
        console.log('✅ Pollen report submitted successfully!');
        console.log('Analysis:', result.analysisResult);
        // Update UI with success message
        // Add to map visualization
        // Show pollen density results
    } else {
        console.error('❌ Submission failed:', result.error);
        // Show error message to user
    }
}