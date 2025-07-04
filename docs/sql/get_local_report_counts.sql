-- Get local report counts by proximity tiers
-- Usage: SELECT * FROM get_local_report_counts(lat, lon, zip_code);

CREATE OR REPLACE FUNCTION get_local_report_counts(
  user_lat DECIMAL,
  user_lon DECIMAL,
  user_zip TEXT DEFAULT NULL
)
RETURNS TABLE (
  radius_label TEXT,
  report_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT '0.5 miles' AS radius_label, COUNT(*)::INTEGER FROM submissions
  WHERE flagged = false
    AND ST_DWithin(
      ST_MakePoint(user_lon, user_lat)::geography,
      ST_MakePoint(longitude, latitude)::geography,
      0.5 * 1609.34
    )
  UNION ALL
  SELECT '1 mile', COUNT(*)::INTEGER FROM submissions
  WHERE flagged = false
    AND ST_DWithin(
      ST_MakePoint(user_lon, user_lat)::geography,
      ST_MakePoint(longitude, latitude)::geography,
      1 * 1609.34
    )
  UNION ALL
  SELECT '5 miles', COUNT(*)::INTEGER FROM submissions
  WHERE flagged = false
    AND ST_DWithin(
      ST_MakePoint(user_lon, user_lat)::geography,
      ST_MakePoint(longitude, latitude)::geography,
      5 * 1609.34
    )
  UNION ALL
  SELECT '10 miles', COUNT(*)::INTEGER FROM submissions
  WHERE flagged = false
    AND ST_DWithin(
      ST_MakePoint(user_lon, user_lat)::geography,
      ST_MakePoint(longitude, latitude)::geography,
      10 * 1609.34
    )
  UNION ALL
  SELECT 'zip_code', COUNT(*)::INTEGER FROM submissions
  WHERE flagged = false
    AND zip_code = user_zip;
END;
$$ LANGUAGE plpgsql;
