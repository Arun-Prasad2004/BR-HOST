from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os
from pymongo import MongoClient
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

# MongoDB Atlas Connection
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://technocelestials:arunpass123@technocelestials.pic31.mongodb.net/BailReckoner?retryWrites=true&w=majority&appName=TechnoCelestials")
client = MongoClient(MONGO_URI)
db = client["BailReckoner"]
collection = db["cases"]

# Load ML Model — relative to this file so it works on any server
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model_judge_1.pkl")
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

# Risk level mapping (numerical to string)
risk_mapping = {
    0: "Low Risk",
    1: "Medium Risk",
    2: "High Risk"
}

# Dummy data for fitting scaler (should ideally be actual training data)
dummy_data = np.array([
    [0, 0, 0, 0, 0, 1, 0, 0, 0],
    [2, 1, 10, 1, 2, 3, 1, 1, 2]
])
scaler = StandardScaler()
scaler.fit(dummy_data)

@app.route("/predict", methods=["POST"])
def predict_bail():
    try:
        data = request.get_json()
        case_number = data.get("case_number")

        if not case_number:
            return jsonify({"error": "Missing case_number"}), 400

        case = collection.find_one({"case_number": case_number})

        if not case:
            return jsonify({"error": "Case not found"}), 404

        bail_factors = case.get("bail_assessment")
        if not bail_factors or len(bail_factors) != 9:
            return jsonify({"error": "Bail assessment missing or invalid"}), 400

        # Convert all factor values to native Python ints
        bail_factors = [int(f) for f in bail_factors]

        # Scale the input
        input_scaled = scaler.transform(np.array(bail_factors).reshape(1, -1))

        # Run ML prediction
        prediction = model.predict(input_scaled)[0]

        # Convert numeric prediction to string label
        risk_result = risk_mapping.get(int(prediction), "Unknown")

        return jsonify({
            "case_number": str(case_number),
            "risk_level": risk_result,
            "factors": bail_factors
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5002))
    app.run(host="0.0.0.0", port=port)
