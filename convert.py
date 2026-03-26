import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"
import tensorflow as tf

print("Loading model...")
model = tf.keras.models.load_model('best_model.h5', compile=False)

print(f"Model output shape: {model.output_shape}")

print("Converting to TFLite...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

with open('plant_disease.tflite', 'wb') as f:
    f.write(tflite_model)

print("Saved as plant_disease.tflite")
