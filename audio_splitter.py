#!/usr/bin/env python3
import os
import sys
import math
from pydub import AudioSegment
import argparse
from tqdm import tqdm

def split_audio(input_file, output_dir="output", max_duration_mins=20, max_size_mb=19.5):
    """
    Split an audio file into chunks, ensuring each is under the specified duration and file size.
    
    Args:
        input_file (str): Path to the input audio file
        output_dir (str): Directory to save the output files
        max_duration_mins (int): Maximum duration in minutes for each chunk
        max_size_mb (float): Maximum file size in MB for each chunk
    """
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Load the audio file
    print(f"Loading audio file: {input_file}")
    audio = AudioSegment.from_file(input_file)
    
    # Calculate max duration in milliseconds
    max_duration_ms = max_duration_mins * 60 * 1000
    
    # Get the base filename without extension
    base_filename = os.path.splitext(os.path.basename(input_file))[0]
    
    # Initialize variables
    start_time = 0
    chunk_number = 1
    total_duration = len(audio)
    
    print(f"Total audio duration: {total_duration / 60000:.2f} minutes")
    
    # Split the audio
    while start_time < total_duration:
        # Calculate end time based on max duration
        end_time = min(start_time + max_duration_ms, total_duration)
        
        # Extract chunk
        chunk = audio[start_time:end_time]
        
        # Generate output filename
        output_filename = f"{base_filename}_part{chunk_number:03d}.m4a"
        output_path = os.path.join(output_dir, output_filename)
        
        # Export chunk
        print(f"Exporting chunk {chunk_number}: {start_time/60000:.2f} min to {end_time/60000:.2f} min")
        chunk.export(output_path, format="ipod")
        
        # Check file size
        chunk_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"Chunk size: {chunk_size_mb:.2f} MB")
        
        # If the chunk is too large, reduce the duration and retry
        if chunk_size_mb > max_size_mb and (end_time - start_time) > 60000:  # At least 1 min segments
            # Delete the oversized file
            os.remove(output_path)
            
            # Reduce duration by 10%
            new_duration = int((end_time - start_time) * 0.9)
            end_time = start_time + new_duration
            
            # Extract smaller chunk
            chunk = audio[start_time:end_time]
            print(f"Chunk too large, reducing to {new_duration/60000:.2f} minutes")
            
            # Export adjusted chunk
            chunk.export(output_path, format="ipod")
            chunk_size_mb = os.path.getsize(output_path) / (1024 * 1024)
            print(f"New chunk size: {chunk_size_mb:.2f} MB")
        
        # Move to next chunk
        start_time = end_time
        chunk_number += 1
    
    print(f"Audio splitting complete. {chunk_number-1} chunks created in {output_dir}")

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Split audio files into chunks under specified duration and size")
    parser.add_argument("input_file", help="Path to the input audio file")
    parser.add_argument("--output-dir", default="output", help="Directory to save output files")
    parser.add_argument("--max-duration", type=int, default=20, help="Maximum duration in minutes for each chunk")
    parser.add_argument("--max-size", type=float, default=19.5, help="Maximum file size in MB for each chunk")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_file):
        print(f"Error: Input file '{args.input_file}' does not exist.")
        sys.exit(1)
    
    split_audio(args.input_file, args.output_dir, args.max_duration, args.max_size)

if __name__ == "__main__":
    main() 