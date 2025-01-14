import json
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.utils import get_video_id_from_url
import re

def get_transcript(url):
    # Extract the video ID from the URL
    try:
        video_id = get_video_id_from_url(url)
    except ValueError as e:
        print(f"Error parsing video ID from URL: {e}")
        return None

    # List available transcripts for the video
    try:
        srt = YouTubeTranscriptApi.list_transcripts(video_id)
    except Exception as e:
        print(f"Error listing transcripts for video {video_id}: {e}")
        return None

    transcript = None
    
    # Loop through available transcripts and choose the most suitable one
    for i in srt:
        # If a manually uploaded transcript exists, prioritize it
        if not i.is_generated:
            try:
                transcript = i.fetch()
                break  # Stop looking once a manual transcript is found
            except Exception as e:
                print(f"Error fetching manual transcript for video {video_id}: {e}")
                continue
            
    if not transcript:
      # if no manual transcript, and it's auto-generated, fetch it
        for i in srt:
            if i.is_generated:
              try:
                transcript = i.fetch()
                break
              except Exception as e:
                print(f"Error fetching auto-generated transcript for video {video_id}: {e}")
                continue
    
    if not transcript:
      print(f"No suitable transcript found for video: {video_id}")
      return None

    # Return the fetched transcript as plain text (without time stamps)
    plain_text_transcript = " ".join([item['text'] for item in transcript])
    # Remove multiple spaces
    plain_text_transcript = re.sub(' +', ' ', plain_text_transcript).strip()

    return plain_text_transcript

def handler(request):
    try:
        data = request.get_json()
        url = data.get('url')
        if not url:
            return json.dumps({"error": "Video URL is required"}), 400, {"Content-Type": "application/json"}
        transcript = get_transcript(url)
        if transcript:
            return json.dumps({"transcript": transcript}), 200, {"Content-Type": "application/json"}
        else:
            return json.dumps({"error": "Could not fetch transcript"}), 404, {"Content-Type": "application/json"}
    except Exception as e:
        return json.dumps({"error": str(e)}), 500, {"Content-Type": "application/json"}
