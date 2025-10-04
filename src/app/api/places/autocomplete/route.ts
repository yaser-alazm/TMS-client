import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || query.length < 3) {
      return NextResponse.json({ 
        status: 'INVALID_REQUEST',
        error_message: 'Query must be at least 3 characters long' 
      });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        status: 'REQUEST_DENIED',
        error_message: 'Google Maps API key not configured' 
      });
    }

    const queries = [
      query, 
      `${query} city`, 
      `${query} street`, 
      `${query} address`, 
    ];

    const allResults = [];
    
    for (const searchQuery of queries) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.results) {
            allResults.push(...data.results);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch results for query: ${searchQuery}`, error);
      }
    }

    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.formatted_address === result.formatted_address)
    );

    if (uniqueResults.length > 0) {
      const transformedData = {
        status: 'OK',
        predictions: uniqueResults.slice(0, 8).map((result: any, index: number) => ({
          place_id: `geocode_${index}_${Date.now()}`, // Generate a unique ID
          description: result.formatted_address,
          structured_formatting: {
            main_text: result.formatted_address.split(',')[0] || result.formatted_address,
            secondary_text: result.formatted_address.split(',').slice(1).join(',').trim(),
          },
          geometry: result.geometry,
        })),
      };
      return NextResponse.json(transformedData);
    } else {
      return NextResponse.json({ 
        status: 'ZERO_RESULTS',
        predictions: [] 
      });
    }
    
  } catch (error) {
    console.error('Places autocomplete error:', error);
    return NextResponse.json({ 
      status: 'UNKNOWN_ERROR',
      error_message: 'Internal server error' 
    });
  }
}
