mod db;
mod models;

use db::{init_db, DbState};
use models::{Product, SaleInput, Customer, SalesByDay, TopProduct, Supplier, Purchase, PurchaseInput, ActivityLog, User, UserSafe};
use tauri::Manager;
use sqlx::Row;
use bcrypt::{hash, verify, DEFAULT_COST};

// --- Helper Functions ---
async fn log_activity<'a, E>(executor: E, category: &str, action: &str, details: Option<&str>, target_id: Option<i64>) -> Result<(), String> 
where
    E: sqlx::Executor<'a, Database = sqlx::Sqlite>,
{
    sqlx::query("INSERT INTO activity_logs (category, action, details, target_id) VALUES (?, ?, ?, ?)")
        .bind(category)
        .bind(action)
        .bind(details)
        .bind(target_id)
        .execute(executor)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// --- User Commands ---

#[tauri::command]
async fn login_user(state: tauri::State<'_, DbState>, user_id: i64, pin: String) -> Result<Option<UserSafe>, String> {
    let user = sqlx::query_as::<_, User>("SELECT id, name, pin_hash, role FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| e.to_string())?;

    if let Some(user) = user {
        if verify(&pin, &user.pin_hash).unwrap_or(false) {
            log_activity(&state.pool, "system", "Inicio de sesión", Some(&format!("Usuario: {}", user.name)), user.id).await?;
            return Ok(Some(UserSafe {
                id: user.id.unwrap_or(0),
                name: user.name,
                role: user.role,
            }));
        }
    }
    
    Ok(None)
}

#[tauri::command]
async fn get_users(state: tauri::State<'_, DbState>) -> Result<Vec<UserSafe>, String> {
    let users = sqlx::query_as::<_, UserSafe>("SELECT id, name, role FROM users ORDER BY id ASC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(users)
}

#[tauri::command]
async fn upsert_user(state: tauri::State<'_, DbState>, user: User) -> Result<(), String> {
    let pin_hash = if !user.pin_hash.is_empty() {
        Some(hash(&user.pin_hash, 4).map_err(|e| e.to_string())?)
    } else {
        None
    };

    if let Some(id) = user.id {
        if let Some(hash) = pin_hash {
            sqlx::query("UPDATE users SET name = ?, pin_hash = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                .bind(&user.name)
                .bind(hash)
                .bind(&user.role)
                .bind(id)
                .execute(&state.pool)
                .await
                .map_err(|e| e.to_string())?;
        } else {
            sqlx::query("UPDATE users SET name = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                .bind(&user.name)
                .bind(&user.role)
                .bind(id)
                .execute(&state.pool)
                .await
                .map_err(|e| e.to_string())?;
        }
        log_activity(&state.pool, "settings", "Usuario actualizado", Some(&user.name), Some(id)).await?;
    } else {
        if let Some(hash) = pin_hash {
            let id = sqlx::query("INSERT INTO users (name, pin_hash, role) VALUES (?, ?, ?)")
                .bind(&user.name)
                .bind(hash)
                .bind(&user.role)
                .execute(&state.pool)
                .await
                .map_err(|e| e.to_string())?
                .last_insert_rowid();
            log_activity(&state.pool, "settings", "Usuario creado", Some(&user.name), Some(id)).await?;
        } else {
            return Err("El PIN es obligatorio para nuevos usuarios".to_string());
        }
    }
    
    Ok(())
}

#[tauri::command]
async fn delete_user(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    if id == 1 {
        return Err("No se puede eliminar al administrador principal".to_string());
    }
    
    sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    
    log_activity(&state.pool, "settings", "Usuario eliminado", Some(&format!("ID: {}", id)), Some(id)).await?;
    
    Ok(())
}

// --- General Commands ---

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_app_settings(state: tauri::State<'_, DbState>) -> Result<serde_json::Value, String> {
    let rows = sqlx::query("SELECT key, value FROM settings")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    
    let mut settings = serde_json::Map::new();
    for row in rows {
        let key: String = row.get("key");
        let value: String = row.get("value");
        settings.insert(key, serde_json::Value::String(value));
    }
    
    Ok(serde_json::Value::Object(settings))
}

#[tauri::command]
async fn update_setting(state: tauri::State<'_, DbState>, key: String, value: String) -> Result<(), String> {
    sqlx::query("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
        .bind(&key)
        .bind(&value)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    
    log_activity(&state.pool, "settings", &format!("Updated {}", key), Some(&value), None).await?;
    
    Ok(())
}

// --- Product Commands ---

#[tauri::command]
async fn get_products(state: tauri::State<'_, DbState>) -> Result<Vec<Product>, String> {
    let products = sqlx::query_as::<_, Product>("SELECT id, name, sku, price, CAST(stock_quantity AS REAL) as stock_quantity, category_id, brand, supplier_id, stock_type FROM products")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| {
            eprintln!("Error fetching products: {}", e);
            e.to_string()
        })?;
    
    Ok(products)
}

#[tauri::command]
async fn upsert_product(state: tauri::State<'_, DbState>, product: Product) -> Result<(), String> {
    println!("Upserting product: {:?}", product);
    if let Some(id) = product.id {
        sqlx::query("UPDATE products SET name = ?, sku = ?, price = ?, stock_quantity = ?, category_id = ?, brand = ?, supplier_id = ?, stock_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(&product.name)
            .bind(&product.sku)
            .bind(product.price)
            .bind(product.stock_quantity)
            .bind(product.category_id)
            .bind(&product.brand)
            .bind(product.supplier_id)
            .bind(&product.stock_type)
            .bind(id)
            .execute(&state.pool)
            .await
            .map_err(|e| {
                eprintln!("Error updating product: {}", e);
                format!("Error al actualizar producto: {}", e)
            })?;
        log_activity(&state.pool, "inventory", "Updated product", Some(&product.name), Some(id)).await?;
    } else {
        sqlx::query("INSERT INTO products (name, sku, price, stock_quantity, category_id, brand, supplier_id, stock_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&product.name)
            .bind(&product.sku)
            .bind(product.price)
            .bind(product.stock_quantity)
            .bind(product.category_id)
            .bind(&product.brand)
            .bind(product.supplier_id)
            .bind(&product.stock_type)
            .execute(&state.pool)
            .await
            .map_err(|e| {
                eprintln!("Error inserting product: {}", e);
                format!("Error al insertar producto: {}", e)
            })?;
        log_activity(&state.pool, "inventory", "Added product", Some(&product.name), None).await?;
    }
    
    Ok(())
}

#[tauri::command]
async fn delete_product(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM products WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    
    log_activity(&state.pool, "inventory", "Deleted product", Some(&format!("ID: {}", id)), Some(id)).await?;
    
    Ok(())
}

// --- Customer Commands ---

#[tauri::command]
async fn get_customers(state: tauri::State<'_, DbState>) -> Result<Vec<Customer>, String> {
    let customers = sqlx::query_as::<_, Customer>("SELECT id, name, email, phone, address FROM customers ORDER BY name")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(customers)
}

#[tauri::command]
async fn upsert_customer(state: tauri::State<'_, DbState>, customer: Customer) -> Result<(), String> {
    if let Some(id) = customer.id {
        sqlx::query("UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(&customer.name)
            .bind(&customer.email)
            .bind(&customer.phone)
            .bind(&customer.address)
            .bind(id)
            .execute(&state.pool)
            .await
            .map_err(|e| e.to_string())?;
        log_activity(&state.pool, "customer", "Updated customer", Some(&customer.name), Some(id)).await?;
    } else {
        sqlx::query("INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)")
            .bind(&customer.name)
            .bind(&customer.email)
            .bind(&customer.phone)
            .bind(&customer.address)
            .execute(&state.pool)
            .await
            .map_err(|e| e.to_string())?;
        log_activity(&state.pool, "customer", "Added customer", Some(&customer.name), None).await?;
    }
    
    Ok(())
}

#[tauri::command]
async fn delete_customer(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM customers WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    
    log_activity(&state.pool, "customer", "Deleted customer", Some(&format!("ID: {}", id)), Some(id)).await?;
    
    Ok(())
}

// --- Supplier Commands ---

#[tauri::command]
async fn get_suppliers(state: tauri::State<'_, DbState>) -> Result<Vec<Supplier>, String> {
    let suppliers = sqlx::query_as::<_, Supplier>("SELECT id, name, contact_name, email, phone, address FROM suppliers ORDER BY name")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(suppliers)
}

#[tauri::command]
async fn upsert_supplier(state: tauri::State<'_, DbState>, supplier: Supplier) -> Result<(), String> {
    if let Some(id) = supplier.id {
        sqlx::query("UPDATE suppliers SET name = ?, contact_name = ?, email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(&supplier.name)
            .bind(&supplier.contact_name)
            .bind(&supplier.email)
            .bind(&supplier.phone)
            .bind(&supplier.address)
            .bind(id)
            .execute(&state.pool)
            .await
            .map_err(|e| e.to_string())?;
        log_activity(&state.pool, "supplier", "Updated supplier", Some(&supplier.name), Some(id)).await?;
    } else {
        sqlx::query("INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES (?, ?, ?, ?, ?)")
            .bind(&supplier.name)
            .bind(&supplier.contact_name)
            .bind(&supplier.email)
            .bind(&supplier.phone)
            .bind(&supplier.address)
            .execute(&state.pool)
            .await
            .map_err(|e| e.to_string())?;
        log_activity(&state.pool, "supplier", "Added supplier", Some(&supplier.name), None).await?;
    }
    
    Ok(())
}

#[tauri::command]
async fn delete_supplier(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM suppliers WHERE id = ?")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    
    log_activity(&state.pool, "supplier", "Deleted supplier", Some(&format!("ID: {}", id)), Some(id)).await?;
    
    Ok(())
}

// --- Purchase Commands ---

#[tauri::command]
async fn process_purchase(state: tauri::State<'_, DbState>, purchase: PurchaseInput) -> Result<i64, String> {
    let mut tx = state.pool.begin().await.map_err(|e| e.to_string())?;

    let purchase_id = sqlx::query("INSERT INTO purchases (supplier_id, total_amount) VALUES (?, ?)")
        .bind(purchase.supplier_id)
        .bind(purchase.total_amount)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?
        .last_insert_rowid();

    let mut item_summaries = Vec::new();
    for item in purchase.items {
        let product_name: String = sqlx::query_scalar("SELECT name FROM products WHERE id = ?")
            .bind(item.product_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost) VALUES (?, ?, ?, ?)")
            .bind(purchase_id)
            .bind(item.product_id)
            .bind(item.quantity)
            .bind(item.unit_cost)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(item.quantity)
            .bind(item.product_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        item_summaries.push(format!("{} (x{})", product_name, item.quantity));
    }

    let details = format!("Inversión: S/{:.2} | Artículos: {}", purchase.total_amount, item_summaries.join(", "));
    log_activity(&mut *tx, "purchase", "Compra Registrada", Some(&details), Some(purchase_id)).await?;

    tx.commit().await.map_err(|e| e.to_string())?;
    
    Ok(purchase_id)
}

#[tauri::command]
async fn get_purchases(state: tauri::State<'_, DbState>) -> Result<Vec<Purchase>, String> {
    let purchases = sqlx::query_as::<_, Purchase>(
        "SELECT p.id, p.supplier_id, p.total_amount, p.created_at, s.name as supplier_name 
         FROM purchases p 
         JOIN suppliers s ON p.supplier_id = s.id 
         ORDER BY p.created_at DESC"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(purchases)
}

// --- Sale Commands ---

#[tauri::command]
async fn process_sale(state: tauri::State<'_, DbState>, sale: SaleInput) -> Result<i64, String> {
    let mut tx = state.pool.begin().await.map_err(|e| e.to_string())?;

    let sale_id = sqlx::query("INSERT INTO sales (customer_id, total_amount, payment_method) VALUES (?, ?, ?)")
        .bind(sale.customer_id)
        .bind(sale.total_amount)
        .bind(&sale.payment_method)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?
        .last_insert_rowid();

    let mut item_summaries = Vec::new();
    for item in sale.items {
        let product_name: String = sqlx::query_scalar("SELECT name FROM products WHERE id = ?")
            .bind(item.product_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)")
            .bind(sale_id)
            .bind(item.product_id)
            .bind(item.quantity)
            .bind(item.unit_price)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(item.quantity)
            .bind(item.product_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        
        item_summaries.push(format!("{} (x{})", product_name, item.quantity));
    }

    let details = format!("Total: S/{:.2} | Artículos: {}", sale.total_amount, item_summaries.join(", "));
    log_activity(&mut *tx, "sale", "Venta Procesada", Some(&details), Some(sale_id)).await?;

    tx.commit().await.map_err(|e| e.to_string())?;
    
    Ok(sale_id)
}

// --- Analytics & Reports Commands ---

#[tauri::command]
async fn get_activity_logs(state: tauri::State<'_, DbState>) -> Result<Vec<ActivityLog>, String> {
    println!("Fetching activity logs...");
    let logs = sqlx::query_as::<_, ActivityLog>("SELECT id, category, action, details, target_id, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 100")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| {
            eprintln!("Error fetching activity logs from DB: {}", e);
            e.to_string()
        })?;
    
    println!("Found {} activity logs", logs.len());
    Ok(logs)
}

#[tauri::command]
async fn clear_activity_logs(state: tauri::State<'_, DbState>) -> Result<(), String> {
    sqlx::query("DELETE FROM activity_logs")
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    
    log_activity(&state.pool, "settings", "Bitácora reiniciada", Some("Se eliminaron todos los registros permanentemente"), None).await?;
    Ok(())
}

#[tauri::command]
async fn get_sales_by_day(state: tauri::State<'_, DbState>) -> Result<Vec<SalesByDay>, String> {
    let rows = sqlx::query_as::<_, SalesByDay>(
        "SELECT strftime('%Y-%m-%d', created_at) as day, SUM(total_amount) as total 
         FROM sales 
         WHERE created_at >= date('now', '-30 days')
         GROUP BY day 
         ORDER BY day ASC"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(rows)
}

#[tauri::command]
async fn get_top_products_stats(state: tauri::State<'_, DbState>) -> Result<Vec<TopProduct>, String> {
    let rows = sqlx::query_as::<_, TopProduct>(
        "SELECT p.name, SUM(CAST(si.quantity AS REAL)) as quantity, SUM(si.quantity * si.unit_price) as total_revenue 
         FROM sale_items si
         JOIN products p ON si.product_id = p.id
         GROUP BY p.id
         ORDER BY quantity DESC
         LIMIT 5"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(rows)
}

#[tauri::command]
async fn get_dashboard_stats(state: tauri::State<'_, DbState>) -> Result<serde_json::Value, String> {
    let sales_today: f64 = sqlx::query("SELECT SUM(total_amount) FROM sales WHERE date(created_at) = date('now')")
        .fetch_one(&state.pool)
        .await
        .map(|r| r.get::<Option<f64>, _>(0).unwrap_or(0.0))
        .map_err(|e| e.to_string())?;

    let total_products: i64 = sqlx::query("SELECT COUNT(*) FROM products")
        .fetch_one(&state.pool)
        .await
        .map(|r| r.get::<i64, _>(0))
        .map_err(|e| e.to_string())?;

    let total_customers: i64 = sqlx::query("SELECT COUNT(*) FROM customers")
        .fetch_one(&state.pool)
        .await
        .map(|r| r.get::<i64, _>(0))
        .map_err(|e| e.to_string())?;

    let monthly_revenue: f64 = sqlx::query("SELECT SUM(total_amount) FROM sales WHERE created_at >= date('now', 'start of month')")
        .fetch_one(&state.pool)
        .await
        .map(|r| r.get::<Option<f64>, _>(0).unwrap_or(0.0))
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "sales_today": sales_today,
        "total_products": total_products,
        "total_customers": total_customers,
        "monthly_revenue": monthly_revenue
    }))
}

#[tauri::command]
async fn export_to_csv(state: tauri::State<'_, DbState>, table_name: String) -> Result<String, String> {
    let mut csv_data = String::new();
    
    match table_name.as_str() {
        "products" => {
            csv_data.push_str("ID,Nombre,SKU,Precio,Stock,Marca,Tipo Unidad\n");
            let products = sqlx::query("SELECT id, name, sku, price, stock_quantity, brand, stock_type FROM products")
                .fetch_all(&state.pool)
                .await
                .map_err(|e| e.to_string())?;
            
            for row in products {
                let id: i64 = row.get("id");
                let name: String = row.get("name");
                let sku: Option<String> = row.get("sku");
                let price: f64 = row.get("price");
                let stock_quantity: f64 = row.get("stock_quantity");
                let brand: Option<String> = row.get("brand");
                let stock_type: Option<String> = row.get("stock_type");

                csv_data.push_str(&format!("{},\"{}\",\"{}\",{},{},\"{}\",\"{}\"\n", 
                    id, 
                    name, 
                    sku.unwrap_or_default(), 
                    price, 
                    stock_quantity, 
                    brand.unwrap_or_default(), 
                    stock_type.unwrap_or_else(|| "quantity".to_string())
                ));
            }
        },
        "sales" => {
            csv_data.push_str("ID,Fecha,Monto Total,Metodo Pago\n");
            let sales = sqlx::query("SELECT id, created_at, total_amount, payment_method FROM sales")
                .fetch_all(&state.pool)
                .await
                .map_err(|e| e.to_string())?;
            
            for row in sales {
                let id: i64 = row.get("id");
                let created_at: String = row.get("created_at");
                let total_amount: f64 = row.get("total_amount");
                let payment_method: String = row.get("payment_method");

                csv_data.push_str(&format!("{},\"{}\",{},\"{}\"\n", 
                    id, 
                    created_at, 
                    total_amount, 
                    payment_method
                ));
            }
        },
        _ => return Err("Tabla no soportada para exportación".to_string()),
    }
    
    Ok(csv_data)
}

#[tauri::command]
async fn get_sale_details(state: tauri::State<'_, DbState>, sale_id: i64) -> Result<serde_json::Value, String> {
    let rows = sqlx::query(
        "SELECT p.name, si.quantity, si.unit_price 
         FROM sale_items si 
         JOIN products p ON si.product_id = p.id 
         WHERE si.sale_id = ?"
    )
    .bind(sale_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    
    let mut details = Vec::new();
    for row in rows {
        let name: String = row.get("name");
        let quantity: f64 = row.get("quantity");
        let unit_price: f64 = row.get("unit_price");

        details.push(serde_json::json!({
            "name": name,
            "quantity": quantity,
            "unit_price": unit_price
        }));
    }
    
    Ok(serde_json::Value::Array(details))
}

#[tauri::command]
async fn get_purchase_details(state: tauri::State<'_, DbState>, purchase_id: i64) -> Result<serde_json::Value, String> {
    let rows = sqlx::query(
        "SELECT p.name, pi.quantity, pi.unit_cost 
         FROM purchase_items pi 
         JOIN products p ON pi.product_id = p.id 
         WHERE pi.purchase_id = ?"
    )
    .bind(purchase_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| e.to_string())?;
    
    let mut details = Vec::new();
    for row in rows {
        let name: String = row.get("name");
        let quantity: f64 = row.get("quantity");
        let unit_cost: f64 = row.get("unit_cost");

        details.push(serde_json::json!({
            "name": name,
            "quantity": quantity,
            "unit_cost": unit_cost
        }));
    }
    
    Ok(serde_json::Value::Array(details))
}

// --- Backup & Restore Commands ---

#[tauri::command]
async fn export_database(state: tauri::State<'_, DbState>, target_path: String) -> Result<(), String> {
    sqlx::query(&format!("VACUUM INTO '{}'", target_path))
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn import_database(app_handle: tauri::AppHandle, source_path: String) -> Result<(), String> {
    let app_dir = app_handle.path().app_data_dir().expect("failed to get app data dir");
    let db_path = app_dir.join("minigocio.db");
    std::fs::copy(source_path, db_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match init_db(&handle).await {
                    Ok(pool) => {
                        handle.manage(DbState { pool });
                        println!("Database initialized successfully");
                    }
                    Err(e) => {
                        eprintln!("Failed to initialize database: {}", e);
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet, 
            login_user,
            get_users,
            upsert_user,
            delete_user,
            get_app_settings, 
            update_setting,
            get_products, 
            upsert_product, 
            delete_product, 
            process_sale,
            get_customers,
            upsert_customer,
            delete_customer,
            get_suppliers,
            upsert_supplier,
            delete_supplier,
            get_purchases,
            process_purchase,
            get_activity_logs,
            clear_activity_logs,
            get_sales_by_day,
            get_top_products_stats,
            get_dashboard_stats,
            export_database,
            import_database,
            export_to_csv,
            get_sale_details,
            get_purchase_details
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
