#!/usr/bin/env python3
import os
import uuid
from flask import Flask, request, render_template, send_from_directory, redirect, url_for
from werkzeug.utils import secure_filename
from audio_splitter import split_audio

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["OUTPUT_FOLDER"] = "output"
app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024  # 500 MB max upload

# Create necessary directories
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(app.config["OUTPUT_FOLDER"], exist_ok=True)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return redirect(request.url)
    
    file = request.files["file"]
    
    if file.filename == "":
        return redirect(request.url)
    
    if file and file.filename.endswith(".m4a"):
        # Create a unique filename
        unique_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        base_filename, ext = os.path.splitext(filename)
        unique_filename = f"{base_filename}_{unique_id}{ext}"
        
        # Save the uploaded file
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], unique_filename)
        file.save(file_path)
        
        # Get parameters
        max_duration = int(request.form.get("max_duration", 20))
        max_size = float(request.form.get("max_size", 19.5))
        
        # Create a unique output directory for this job
        output_dir = os.path.join(app.config["OUTPUT_FOLDER"], unique_id)
        os.makedirs(output_dir, exist_ok=True)
        
        # Process the file
        split_audio(file_path, output_dir, max_duration, max_size)
        
        # Get list of created files
        result_files = sorted([f for f in os.listdir(output_dir) if f.endswith(".m4a")])
        
        return render_template("results.html", files=result_files, job_id=unique_id)
    
    return redirect(request.url)

@app.route("/download/<job_id>/<filename>")
def download_file(job_id, filename):
    output_dir = os.path.join(app.config["OUTPUT_FOLDER"], job_id)
    return send_from_directory(output_dir, filename, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True) 