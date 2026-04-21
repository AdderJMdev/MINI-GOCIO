use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id: Option<i64>,
    pub name: String,
    pub sku: Option<String>,
    pub price: f64,
    pub stock_quantity: f64, // Changed to f64 for weights/volume
    pub category_id: Option<i64>,
    pub brand: Option<String>,
    pub supplier_id: Option<i64>,
    pub stock_type: Option<String>, // quantity, weight, volume
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Customer {
    pub id: Option<i64>,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Supplier {
    pub id: Option<i64>,
    pub name: String,
    pub contact_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Purchase {
    pub id: Option<i64>,
    pub supplier_id: i64,
    pub total_amount: f64,
    pub created_at: String,
    pub supplier_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseItemInput {
    pub product_id: i64,
    pub quantity: f64,
    pub unit_cost: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PurchaseInput {
    pub supplier_id: i64,
    pub total_amount: f64,
    pub items: Vec<PurchaseItemInput>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ActivityLog {
    pub id: Option<i64>,
    pub category: String,
    pub action: String,
    pub details: Option<String>,
    pub target_id: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Option<i64>,
    pub name: String,
    pub pin_hash: String,
    pub role: String, // 'admin' or 'cashier'
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct UserSafe {
    pub id: i64,
    pub name: String,
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct SalesByDay {
    pub day: String,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct TopProduct {
    pub name: String,
    pub quantity: f64,
    pub total_revenue: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaleItemInput {
    pub product_id: i64,
    pub quantity: f64,
    pub unit_price: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaleInput {
    pub customer_id: Option<i64>,
    pub total_amount: f64,
    pub payment_method: String,
    pub items: Vec<SaleItemInput>,
}
