from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
import numpy as np
import cv2

app = Flask(__name__)
CORS(app)


reader = easyocr.Reader(['en'], gpu=False)

@app.route("/ocr", methods=["POST"])
def ocr():
    if "image" not in request.files:
        return jsonify({"error": "No image file received"}), 400

    file = request.files["image"]
    img_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)

    results = reader.readtext(img)

    data = []
    for (bbox, text, conf) in results:
        # bbox = 4 points: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
        data.append({
            "bbox": bbox,
            "text": text,
            "confidence": float(conf)
        })

    return jsonify({"results": data})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
