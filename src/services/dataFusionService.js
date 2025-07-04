/**
 * Data Fusion Service
 * Combines Google Pollen API data with user submissions for enhanced accuracy
 */

import googlePollenService from './googlePollenService.js';
import { crowdPollenAPI } from './crowdPollenAPI.js';

/**
 * Validation status constants
 */
export const VALIDATION_STATUS = {
  VALIDATED: 'validated',
  VARIANCE: 'variance',
  SIGNIFICANT_VARIANCE: 'significant_variance',
  NO_DATA: 'no_data',
  ERROR: 'error'
};

/**
 * Data source weights for fusion algorithm
 */
const FUSION_WEIGHTS = {
  google: 0.7,        // Base weight for Google data
  user: 0.3,          // Base weight for user data
  recency: 0.2,       // Boost for recent submissions
  density: 0.1,       // Boost for areas with many submissions
  accuracy: 0.15      // Boost for historically accurate users
};

/**
 * Validate user submission against Google forecast data
 * @param {Object} userSubmission - User pollen submission
 * @param {Object} googleForecast - Google forecast data for same location/date
 * @returns {Object} Validation result with status and details
 */
export const validateSubmission = async (userSubmission, googleForecast = null) => {
  try {
    // If no Google forecast provided, fetch it
    if (!googleForecast && userSubmission.latitude && userSubmission.longitude) {
      try {
        const forecast = await googlePollenService.getForecast(
          userSubmission.latitude,
          userSubmission.longitude,
          1
        );
        googleForecast = forecast.dailyForecasts[0];
      } catch (error) {
        console.warn('Could not fetch Google forecast for validation:', error);
        return {
          status: VALIDATION_STATUS.NO_DATA,
          variance: null,
          notes: 'No Google forecast data available for this location',
          googleData: null
        };
      }
    }

    if (!googleForecast) {
      return {
        status: VALIDATION_STATUS.NO_DATA,
        variance: null,
        notes: 'No forecast data available',
        googleData: null
      };
    }

    // Convert user submission level to numeric value for comparison
    const userLevel = convertLevelToNumeric(userSubmission.pollen_level);
    
    // Get overall Google forecast level
    const googleLevel = getGoogleOverallLevel(googleForecast.pollenTypes);
    
    // Calculate variance percentage
    const variance = calculateVariance(userLevel, googleLevel);
    
    // Determine validation status based on variance
    let status;
    let notes = '';
    
    if (variance <= 30) {
      status = VALIDATION_STATUS.VALIDATED;
      notes = `User report matches Google forecast (${variance.toFixed(1)}% variance)`;
    } else if (variance <= 50) {
      status = VALIDATION_STATUS.VARIANCE;
      notes = `Moderate variance from Google forecast (${variance.toFixed(1)}% difference)`;
    } else {
      status = VALIDATION_STATUS.SIGNIFICANT_VARIANCE;
      notes = `Significant variance from Google forecast (${variance.toFixed(1)}% difference)`;
    }

    return {
      status,
      variance,
      notes,
      googleData: {
        overall_level: googleLevel,
        tree_level: convertLevelToNumeric(googlePollenService.convertCategoryToLevel(googleForecast.pollenTypes.tree.category)),
        grass_level: convertLevelToNumeric(googlePollenService.convertCategoryToLevel(googleForecast.pollenTypes.grass.category)),
        weed_level: convertLevelToNumeric(googlePollenService.convertCategoryToLevel(googleForecast.pollenTypes.weed.category)),
        forecast_date: googleForecast.date
      }
    };

  } catch (error) {
    console.error('Error validating submission:', error);
    return {
      status: VALIDATION_STATUS.ERROR,
      variance: null,
      notes: `Validation error: ${error.message}`,
      googleData: null
    };
  }
};

/**
 * Create combined forecast using both Google data and user submissions
 * @param {Object} googleData - Google forecast data
 * @param {Array} userSubmissions - Recent user submissions for the area
 * @param {Object} options - Fusion options
 * @returns {Object} Combined forecast with confidence metrics
 */
export const createCombinedForecast = (googleData, userSubmissions = [], options = {}) => {
  const {
    radiusKm = 10,           // Radius for considering user submissions
    maxAgeHours = 24,        // Maximum age of user submissions to consider
    minSubmissions = 3       // Minimum submissions needed for user data influence
  } = options;

  // Filter relevant user submissions
  const relevantSubmissions = filterRelevantSubmissions(
    userSubmissions,
    googleData.location || {},
    radiusKm,
    maxAgeHours
  );

  // If we don't have enough user data, return Google data with high confidence
  if (relevantSubmissions.length < minSubmissions) {
    return {
      forecast: googleData,
      confidence: 0.85,
      dataSource: 'google_primary',
      userDataInfluence: 0,
      submissionCount: relevantSubmissions.length,
      notes: 'Forecast based primarily on Google data due to limited user submissions'
    };
  }

  // Calculate user data statistics
  const userStats = calculateUserDataStats(relevantSubmissions);
  
  // Apply fusion algorithm
  const fusedForecast = applyFusionAlgorithm(googleData, userStats);
  
  // Calculate confidence based on data agreement
  const confidence = calculateConfidence(googleData, userStats, relevantSubmissions.length);

  return {
    forecast: fusedForecast,
    confidence,
    dataSource: 'hybrid',
    userDataInfluence: calculateUserInfluence(relevantSubmissions.length, userStats.accuracy),
    submissionCount: relevantSubmissions.length,
    notes: `Combined forecast using Google data and ${relevantSubmissions.length} user submissions`
  };
};

/**
 * Get forecast with validation for a specific location
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} days - Number of forecast days
 * @returns {Object} Enhanced forecast with user data integration
 */
export const getEnhancedForecast = async (latitude, longitude, days = 3) => {
  try {
    console.log('Data fusion: Starting enhanced forecast for:', { latitude, longitude, days });
    
    // Fetch Google forecast
    const googleForecast = await googlePollenService.getForecast(latitude, longitude, days);
    console.log('Data fusion: Google forecast received:', googleForecast);
    
    // Fetch recent user submissions for the area
    const userSubmissions = await crowdPollenAPI.getLocalPollenData(latitude, longitude, 10); // 10km radius
    console.log('Data fusion: User submissions received:', userSubmissions);
    
    // Create combined forecasts for each day
    const enhancedForecasts = googleForecast.dailyForecasts.map(dayForecast => {
      const daySubmissions = filterSubmissionsByDate(userSubmissions.submissions || [], dayForecast.date);
      const combined = createCombinedForecast(
        { ...dayForecast, location: { latitude, longitude } },
        daySubmissions
      );
      
      return {
        ...dayForecast,
        combined: combined.forecast,
        confidence: combined.confidence,
        dataSource: combined.dataSource,
        userDataInfluence: combined.userDataInfluence,
        submissionCount: combined.submissionCount
      };
    });

    const finalResult = {
      ...googleForecast,
      dailyForecasts: enhancedForecasts,
      metadata: {
        ...googleForecast.metadata,
        enhanced: true,
        fusionAlgorithm: 'weighted_average_v1'
      }
    };
    
    console.log('Data fusion: Final enhanced forecast:', finalResult);
    return finalResult;

  } catch (error) {
    console.error('Error creating enhanced forecast:', error);
    throw error;
  }
};

/**
 * Convert pollen level string to numeric value for calculations
 */
const convertLevelToNumeric = (level) => {
  const levelMap = {
    'very_low': 1,
    'low': 2,
    'moderate': 3,
    'high': 4,
    'very_high': 5,
    'unknown': 0
  };
  return levelMap[level] || 0;
};

/**
 * Convert numeric value back to pollen level string
 */
const convertNumericToLevel = (value) => {
  const levels = ['unknown', 'very_low', 'low', 'moderate', 'high', 'very_high'];
  const index = Math.round(Math.max(0, Math.min(5, value)));
  return levels[index];
};

/**
 * Get overall pollen level from Google forecast data
 */
const getGoogleOverallLevel = (pollenTypes) => {
  const treeLevel = convertLevelToNumeric(googlePollenService.convertCategoryToLevel(pollenTypes.tree.category));
  const grassLevel = convertLevelToNumeric(googlePollenService.convertCategoryToLevel(pollenTypes.grass.category));
  const weedLevel = convertLevelToNumeric(googlePollenService.convertCategoryToLevel(pollenTypes.weed.category));
  
  return Math.max(treeLevel, grassLevel, weedLevel);
};

/**
 * Calculate variance percentage between two numeric levels
 */
const calculateVariance = (userLevel, googleLevel) => {
  if (googleLevel === 0) return 0; // Can't calculate variance if Google level is unknown
  return Math.abs(userLevel - googleLevel) / googleLevel * 100;
};

/**
 * Filter user submissions by relevance (location, time)
 */
const filterRelevantSubmissions = (submissions, location, radiusKm, maxAgeHours) => {
  const now = new Date();
  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
  
  return submissions.filter(submission => {
    // Check age
    const submissionAge = now - new Date(submission.created_at);
    if (submissionAge > maxAge) return false;
    
    // Check location if coordinates are available
    if (location.latitude && location.longitude && submission.latitude && submission.longitude) {
      const distance = calculateDistance(
        location.latitude, location.longitude,
        submission.latitude, submission.longitude
      );
      return distance <= radiusKm;
    }
    
    return true; // Include if we can't filter by location
  });
};

/**
 * Filter submissions by specific date
 */
const filterSubmissionsByDate = (submissions, targetDate) => {
  const target = new Date(targetDate);
  return submissions.filter(submission => {
    const submissionDate = new Date(submission.created_at);
    return submissionDate.toDateString() === target.toDateString();
  });
};

/**
 * Calculate statistics from user submissions
 */
const calculateUserDataStats = (submissions) => {
  if (submissions.length === 0) {
    return { averageLevel: 0, accuracy: 0, recency: 0 };
  }

  const levels = submissions.map(s => convertLevelToNumeric(s.pollen_level));
  const averageLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
  
  // Calculate average accuracy (if validation data is available)
  const validatedSubmissions = submissions.filter(s => s.google_validation_status === 'validated');
  const accuracy = validatedSubmissions.length / submissions.length;
  
  // Calculate recency score (more recent = higher score)
  const now = Date.now();
  const recencyScores = submissions.map(s => {
    const age = now - new Date(s.created_at).getTime();
    const ageHours = age / (1000 * 60 * 60);
    return Math.max(0, 1 - (ageHours / 24)); // Score decreases over 24 hours
  });
  const recency = recencyScores.reduce((sum, score) => sum + score, 0) / recencyScores.length;

  return { averageLevel, accuracy, recency };
};

/**
 * Apply fusion algorithm to combine Google and user data
 */
const applyFusionAlgorithm = (googleData, userStats) => {
  const googleLevel = getGoogleOverallLevel(googleData.pollenTypes);
  const userLevel = userStats.averageLevel;
  
  // Calculate dynamic weights based on data quality
  const googleWeight = FUSION_WEIGHTS.google + (userStats.accuracy < 0.7 ? 0.1 : 0);
  const userWeight = FUSION_WEIGHTS.user + (userStats.accuracy * FUSION_WEIGHTS.accuracy) + (userStats.recency * FUSION_WEIGHTS.recency);
  
  // Normalize weights
  const totalWeight = googleWeight + userWeight;
  const normalizedGoogleWeight = googleWeight / totalWeight;
  const normalizedUserWeight = userWeight / totalWeight;
  
  // Calculate fused level
  const fusedLevel = (googleLevel * normalizedGoogleWeight) + (userLevel * normalizedUserWeight);
  
  return {
    ...googleData,
    fusedLevel: convertNumericToLevel(fusedLevel),
    weights: {
      google: normalizedGoogleWeight,
      user: normalizedUserWeight
    }
  };
};

/**
 * Calculate confidence score for combined forecast
 */
const calculateConfidence = (googleData, userStats, submissionCount) => {
  let confidence = 0.7; // Base confidence
  
  // Increase confidence if user data agrees with Google data
  const googleLevel = getGoogleOverallLevel(googleData.pollenTypes);
  const variance = Math.abs(googleLevel - userStats.averageLevel) / Math.max(googleLevel, 1);
  
  if (variance < 0.3) confidence += 0.2; // Good agreement
  else if (variance < 0.5) confidence += 0.1; // Moderate agreement
  
  // Increase confidence with more submissions
  confidence += Math.min(0.1, submissionCount * 0.02);
  
  // Increase confidence with higher user accuracy
  confidence += userStats.accuracy * 0.1;
  
  return Math.min(0.95, confidence); // Cap at 95%
};

/**
 * Calculate user data influence percentage
 */
const calculateUserInfluence = (submissionCount, accuracy) => {
  let influence = Math.min(0.4, submissionCount * 0.05); // Base influence from count
  influence *= (0.5 + accuracy * 0.5); // Adjust by accuracy
  return Math.round(influence * 100); // Return as percentage
};

/**
 * Calculate distance between two coordinates in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Export all functions
export default {
  validateSubmission,
  createCombinedForecast,
  getEnhancedForecast,
  VALIDATION_STATUS
};
