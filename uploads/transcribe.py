import whisper
import sys

def transcribe(audio_file, model_size):
    model = whisper.load_model(model_size)

    result = model.transcribe(audio_file)

    transcription = ""
    for segment in result["segments"]:
        start = segment["start"]
        end = segment["end"]
        text = segment["text"]
        transcription += f"[{start:.2f} - {end:.2f}] {text}\n"
    
    with open("transcription.txt", "w") as f:
        f.write(transcription)

    return transcription

if __name__ == "__main__":
    audio_file = sys.argv[1]
    model_size = sys.argv[2]
    transcribe(audio_file, model_size)
