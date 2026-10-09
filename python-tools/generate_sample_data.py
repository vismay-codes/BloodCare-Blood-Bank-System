from pathlib import Path
from datetime import date, timedelta
import random, csv

random.seed(42)
OUT=Path(__file__).parent/"output"
OUT.mkdir(exist_ok=True)
groups=["O-","O+","A-","A+","B-","B+","AB-","AB+"]
cities=["Nagpur","Pune","Mumbai","Nashik","Indore","Hyderabad"]
rows=[]
start=date.today()-timedelta(days=365)
for i in range(420):
    d=start+timedelta(days=random.randint(0,365))
    rows.append({
        "request_date":d.isoformat(),
        "blood_group":random.choices(groups,weights=[5,18,6,28,5,24,2,12])[0],
        "units_needed":random.choices([1,2,3,4],weights=[55,28,12,5])[0],
        "city":random.choice(cities),
        "urgency":random.choices(["NORMAL","URGENT","CRITICAL"],weights=[55,32,13])[0],
    })
with open(OUT/"sample_requests.csv","w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
print(f"Generated {len(rows)} realistic request records: {OUT/'sample_requests.csv'}")
