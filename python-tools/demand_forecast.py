from pathlib import Path
import pandas as pd
import json
from sklearn.linear_model import LinearRegression

BASE=Path(__file__).parent
csv_file=BASE/"output"/"sample_requests.csv"
df=pd.read_csv(csv_file,parse_dates=["request_date"])
df["month"]=df.request_date.dt.to_period("M").astype(str)
monthly=df.groupby("month")["units_needed"].sum().reset_index()
monthly["x"]=range(len(monthly))

model=LinearRegression().fit(monthly[["x"]],monthly["units_needed"])
future_x=[[len(monthly)+i] for i in range(1,4)]
pred=[max(0,round(float(x),2)) for x in model.predict(future_x)]
future=[{"period":"next_month","predicted_units":pred[0]},
        {"period":"month_plus_2","predicted_units":pred[1]},
        {"period":"month_plus_3","predicted_units":pred[2]}]
out=BASE/"output"/"forecast.json"
out.write_text(json.dumps({"model":"LinearRegression","forecast":future},indent=2),encoding="utf-8")
print("Optional ML forecast completed.")
print(json.dumps(future,indent=2))
print(f"Saved: {out}")
