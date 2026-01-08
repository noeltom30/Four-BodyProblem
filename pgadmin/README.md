# pgAdmin Setup Instructions

pgAdmin is now included in the Docker setup! Here's how to access and configure it:

## Access pgAdmin

1. Start all services:
   ```bash
   docker-compose up -d
   ```

2. Open your browser and go to: **http://localhost:5050**

3. Login with:
   - **Email:** `admin@converge.com`
   - **Password:** `Admin@123456`

## Add Database Server Connection

After logging in, you need to add the PostgreSQL server connection:

1. Right-click on **"Servers"** in the left panel
2. Select **"Register" → "Server"**
3. Fill in the **General** tab:
   - **Name:** `Converge Database`
4. Fill in the **Connection** tab:
   - **Host name/address:** `db` (this is the Docker service name)
   - **Port:** `5432`
   - **Maintenance database:** `converge_db`
   - **Username:** `converge_user`
   - **Password:** `converge_secure_pass_2026`
   - Check **"Save password"** if you want
5. Click **"Save"**

Now you can browse your database, run queries, and manage your data through the web interface!

## Quick Access

- **pgAdmin Web UI:** http://localhost:5050
- **Database Host (from host machine):** `localhost:5432`
- **Database Name:** `converge_db`
- **Username:** `converge_user`
- **Password:** `converge_secure_pass_2026`

