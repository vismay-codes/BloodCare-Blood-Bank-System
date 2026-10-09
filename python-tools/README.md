# Python analytics tools

Recommended: Python 3.12.

    python -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    python generate_sample_data.py
    python demand_analysis.py
    python demand_forecast.py

`demand_forecast.py` is the optional ML component. It uses scikit-learn LinearRegression on monthly requested units and produces a small forecast JSON. This keeps ML useful but easy to explain in a fresher interview.
