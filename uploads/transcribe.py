import whisper
import sys

def transcribe(audio_file, model_size):
    try:
        model = whisper.load_model(model_size)
        result = model.transcribe(audio_file)
        return result
    except RuntimeError as e:
        print(f"Error: {e}")
        return None

def format_transcription_with_timestamps(result):
    segments = result['segments']
    formatted_transcription = ""
    for segment in segments:
        start_time = segment['start']
        end_time = segment['end']
        text = segment['text']
        formatted_transcription += f"[{start_time:.2f} - {end_time:.2f}] {text}\n"
    return formatted_transcription

if __name__ == "__main__":
    audio_file = sys.argv[1]
    model_size = sys.argv[2]
    output_file = "transcription_with_timestamps.txt"
    
    valid_models = ['tiny.en', 'tiny', 'base.en', 'base', 'small.en', 'small', 'medium.en', 'medium', 'large-v1', 'large-v2', 'large-v3', 'large']
    
    if model_size not in valid_models:
        print(f"Error: Model {model_size} not found; available models are {valid_models}")
        sys.exit(1)
    
    transcription = transcribe(audio_file, model_size)
    if transcription:
        formatted_transcription = format_transcription_with_timestamps(transcription)
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(formatted_transcription)
        print(f"Transcription with timestamps saved to {output_file}")