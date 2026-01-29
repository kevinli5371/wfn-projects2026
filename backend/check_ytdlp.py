
import yt_dlp
import json

TEST_URL = "https://www.tiktok.com/@bellapoarch/video/6862153058223193350"

def test_ytdlp():
    ydl_opts = {
        'quiet': True,
        'dump_single_json': True,
        'extract_flat': True  # Don't download, just extract info
    }
    
    print(f"Testing yt-dlp with {TEST_URL}...")
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(TEST_URL, download=False)
            
            views = info.get('view_count', 'N/A')
            likes = info.get('like_count', 'N/A')
            uploader = info.get('uploader', 'N/A')
            
            print(f"Success!")
            print(f"Views: {views}")
            print(f"Likes: {likes}")
            print(f"Uploader: {uploader}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ytdlp()
