import os
import json
import ffmpeg
import numpy as np
from flask import Flask, request, jsonify
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from flask_cors import CORS 

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Whisper processor and model
processor = WhisperProcessor.from_pretrained("openai/whisper-small.en")
model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-small.en")

# Function to load and convert audio to 16kHz mono WAV
def load_audio_from_video(file_path, sampling_rate=16000):
    out, _ = (
        ffmpeg.input(file_path)
        .output("pipe:", format="wav", acodec="pcm_s16le", ac=1, ar=sampling_rate)
        .run(capture_stdout=True, capture_stderr=True)
    )
    audio = np.frombuffer(out, np.int16).astype(np.float32) / 32768.0  # Normalize to [-1, 1]
    return audio

# Function to split audio into 30-second chunks
def split_audio(audio, chunk_size=30, sampling_rate=16000):
    chunk_length = chunk_size * sampling_rate  # Number of samples in each chunk
    return [audio[i:i + chunk_length] for i in range(0, len(audio), chunk_length)]

# Function to transcribe audio chunks
def transcribe_audio_chunks(file_path):
    audio = load_audio_from_video(file_path)
    audio_chunks = split_audio(audio)
    transcripts = []

    for i, chunk in enumerate(audio_chunks):
        input_features = processor(chunk, sampling_rate=16000, return_tensors="pt").input_features
        predicted_ids = model.generate(input_features)
        transcription = processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
        transcripts.append({"chunk": i + 1, "transcript": transcription})

    return transcripts  # List of dictionaries with chunk number and transcription

@app.route('/transcribe', methods=['POST'])
def transcribe():
    # Check for 'file_name' in the request data
    data = request.get_json()
    file_name = data.get('file_name')
    
    if not file_name:
        return jsonify({"error": "No file name provided"}), 400

    file_path = os.path.join("../audio-uploads", file_name)  # Set the correct path to the uploaded audio file
    
    # Check if the file exists
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        # Transcribe audio in 30-second chunks
        transcription_chunks = transcribe_audio_chunks(file_path)
        return jsonify({"transcripts": transcription_chunks})
    except Exception as e:
        print(f"Error during transcription: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=False)