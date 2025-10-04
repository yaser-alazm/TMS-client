import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { placeId } = await request.json();
    
    if (!placeId) {
      return NextResponse.json({ 
        status: 'INVALID_REQUEST',
        error_message: 'Place ID is required' 
      });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        status: 'REQUEST_DENIED',
        error_message: 'Google Maps API key not configured' 
      });
    }

    if (placeId.startsWith('geocode_')) {
     placeId.split('_').slice(2).join('_');
      
      return NextResponse.json({ 
        status: 'NOT_FOUND',
        error_message: 'Place details not available for geocoded results' 
      });
    }

    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'formattedAddress,location',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ 
        status: 'REQUEST_DENIED',
        error_message: `HTTP ${response.status}: ${response.statusText}` 
      });
    }

    const data = await response.json();
    
    if (data.formattedAddress && data.location) {
      const transformedData = {
        status: 'OK',
        result: {
          formatted_address: data.formattedAddress,
          geometry: {
            location: {
              lat: data.location.latitude,
              lng: data.location.longitude,
            },
          },
        },
      };
      return NextResponse.json(transformedData);
    } else {
      return NextResponse.json({ 
        status: 'NOT_FOUND',
        error_message: 'Place not found' 
      });
    }
    
  } catch (error) {
    console.error('Places details error:', error);
    return NextResponse.json({ 
      status: 'UNKNOWN_ERROR',
      error_message: 'Internal server error' 
    });
  }
}
