/*
Audio Worklets are a special case. They run in a separate, high-performance audio thread 
that doesn't have access to the main browser environment where React and TypeScript run. 
Because of this, the worklet file itself must be a plain JavaScript file that 
the browser can load directly.
*/

// This function will resample the audio from the source sample rate to the target sample rate.
function resampleAudio(inputBuffer, inputSampleRate, outputSampleRate) {
    if (inputSampleRate === outputSampleRate) {
      return inputBuffer;
    }
  
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.round(inputBuffer.length / ratio);
    const outputBuffer = new Float32Array(outputLength);
  
    for (let i = 0; i < outputLength; i++) {
      const sourceIndex = i * ratio;
      const index = Math.floor(sourceIndex);
      const fraction = sourceIndex - index;
  
      if (index + 1 < inputBuffer.length) {
        outputBuffer[i] = inputBuffer[index] * (1 - fraction) + inputBuffer[index + 1] * fraction;
      } else {
        outputBuffer[i] = inputBuffer[index];
      }
    }
  
    return outputBuffer;
  }
  
  // Define the AudioWorkletProcessor
  class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
      // We only expect one input, which is the microphone audio.
      const input = inputs[0];
      if (input.length > 0) {
        const inputData = input[0];
  
        // 1. Voice Activity Detection (VAD) - Calculate RMS
        let rms = 0;
        for (let i = 0; i < inputData.length; i++) {
          rms += inputData[i] * inputData[i];
        }
        rms = Math.sqrt(rms / inputData.length);
  
        // 2. Only process and send audio if there's sufficient signal
        if (rms > 0.01) {
          // 3. Resample from the AudioContext's sample rate to 16kHz
          const resampledData = resampleAudio(inputData, sampleRate, 16000);
  
          // 4. Convert to 16-bit PCM format
          const pcmData = new Int16Array(resampledData.length);
          for (let i = 0; i < resampledData.length; i++) {
            let sample = resampledData[i];
            if (sample > 0.95) sample = 0.95; // Soft clipping
            if (sample < -0.95) sample = -0.95;
            pcmData[i] = Math.round(sample * 32767);
          }
          
          // 5. Send the processed audio data back to the main thread
          this.port.postMessage(pcmData);
        }
      }
  
      // Return true to keep the processor alive
      return true;
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor);