from pathlib import Path
import pandas as pd
import json

BASE=Path(__file__).parent
csv_file=BASE/"output"/"sample_requests.csv"
df=pd.read_csv(csv_file,parse_dates=["request_date"])
df["month"]=df.request_date.dt.to_period("M").astype(str)

by_group=(df.groupby("blood_group").agg(requests=("blood_group","size"),units=("units_needed","sum"))
          .sort_values("requests",ascending=False))
by_month=(df.groupby("month").agg(requests=("blood_group","size"),units=("units_needed","sum"))
          .sort_index())

result={
 "generated_records":len(df),
 "top_blood_group":by_group.index[0],
 "total_units_requested":int(df.units_needed.sum()),
 "by_group":by_group.reset_index().to_dict("records"),
 "by_month":by_month.reset_index().to_dict("records")
}
out=BASE/"output"/"demand_analysis.json"
out.write_text(json.dumps(result,indent=2),encoding="utf-8")
print("Demand analysis completed.")
print(by_group)
print(f"Saved: {out}")
