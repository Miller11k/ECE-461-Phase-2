export function convertMetricsToFloat(metrics: Record<string, any>): Record<string, number | string> {
    const convertedMetrics: Record<string, number | string> = {};
  
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
        // Convert numeric strings or numbers to floats
        convertedMetrics[key] = parseFloat(value as string);
      } else {
        // Preserve non-numeric values as they are
        convertedMetrics[key] = value;
      }
    }
  
    return convertedMetrics;
  } 