from fastapi import FastAPI

app = FastAPI(
    title="Parcel Tracker Agent A2A",
    description="Handle Parcel Tracking and customer relations on parcel delay",
    version="1.0.0",
    
)

@app.post("/a2a/parcel")
async def parcel_entry():
    print("I AM THE PARCEL GUIDANE")
if __name__ == "__main__":
    PORT = 8000
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)