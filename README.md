# Audio Splitter

A Python application that allows users to split M4A audio files into smaller chunks, ensuring each chunk is under 20 minutes in duration and 19.5MB in file size.

## Features

- Command-line interface for batch processing
- Web interface for easy uploading and downloading
- Ensures all output files are under specified size limits
- Adjusts file lengths dynamically to meet size constraints

## Requirements

- Python 3.6+
- FFmpeg (required by pydub for audio processing)

## Installation

1. Clone this repository
2. Install FFmpeg (if not already installed)
   - On Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
   - On macOS: `brew install ffmpeg`
   - On Ubuntu/Debian: `sudo apt install ffmpeg`
3. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

### Command Line Interface

To split an audio file using the command line:

```
python audio_splitter.py input_file.m4a --output-dir output --max-duration 20 --max-size 19.5
```

### Web Interface

To start the web interface:

```
python audio_splitter_web.py
```

Then open your browser and go to: http://127.0.0.1:5000

## Notes

- The script uses the `ipod` format for M4A output files, which is optimized for audio quality vs file size
- FFmpeg must be installed and accessible in your system PATH
- For very large files, processing may take some time 