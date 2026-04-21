use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;

pub struct DbState {
    pub pool: SqlitePool,
}

pub async fn init_db(app_handle: &AppHandle) -> anyhow::Result<SqlitePool> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    
    fs::create_dir_all(&app_dir)?;
    
    let db_url = format!(
        "sqlite://{}/minigocio.db?mode=rwc",
        app_dir.to_string_lossy()
    );
    
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;
    
    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;
    
    Ok(pool)
}
