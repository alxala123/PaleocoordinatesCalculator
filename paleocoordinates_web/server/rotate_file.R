#!/usr/bin/env Rscript

args <- commandArgs(trailingOnly=TRUE)
if(length(args) != 4) {
  stop("Usage: rotate_file.R <input_csv> <model(s)> <periods_csv> <output_csv>")
}

input_csv <- args[1]
model_input <- args[2]
output_csv <- args[4]
periods_csv <- args[3]

library(dplyr)
library(tidyr)
library(palaeoverse)
library(readxl) 
library(stringr)

cat("\n=== Iniciando script de rotación paleogeográfica ===\n")
cat("Archivo de entrada:", input_csv, "\n")
cat("Modelos:", model_input, "\n")
cat("Archivo de periodos:", periods_csv, "\n")
cat("Archivo de salida:", output_csv, "\n\n")

# Leer el archivo de entrada
cat("Leyendo archivo de entrada...\n")
df <- read.csv(input_csv, header = TRUE, sep = ";", fill = TRUE, stringsAsFactors = FALSE)
cat("Filas leídas:", nrow(df), "\nColumnas:", paste(names(df), collapse = ", "), "\n\n")

# Normalizar nombres columna Name
names(df)[1] <- "Name"

# Validar columnas requeridas
required_cols <- c("lat", "lng", "age_min", "age_max")
if(!all(required_cols %in% colnames(df))) {
  stop("Input CSV debe contener columnas: lat, lng, age_min, age_max")
}

# Convertir numéricos
df$lat <- as.numeric(df$lat)
df$lng <- as.numeric(df$lng)
df$age_min <- as.numeric(df$age_min)
df$age_max <- as.numeric(df$age_max)
df$age_mean <- rowMeans(df[, c("age_min", "age_max")], na.rm = TRUE)

# Leer periodos
cat("Leyendo archivo de periodos...\n")
periods <- read.csv(periods_csv, header = TRUE, stringsAsFactors = FALSE)
periods <- periods %>% arrange(desc(Age))
periods$Age_upper <- c(periods$Age[-1], -Inf)
cat("Periodos leídos:", nrow(periods), "\n\n")

# Asignar periodo según edad
df$Period <- sapply(df$age_mean, function(age) {
  matched <- which(age <= periods$Age & age > periods$Age_upper)
  if(length(matched) == 1) {
    periods$Period[matched]
  } else {
    "Unknown"
  }
})

# Filtrar edad
df <- df %>% filter(age_mean >= 0 & age_mean <= 250)
cat("Filtrado por edad (0–250 Ma):", nrow(df), "filas restantes\n\n")

# Preparar modelos
if(toupper(model_input) == "ALL") {
  models <- c("MERDITH2021", "TorsvikCocks2017", "MATTHEWS2016_pmag_ref", "GOLONKA", "PALEOMAP")
} else {
  models <- strsplit(model_input, ",")[[1]]
}
cat("Modelos a usar:", paste(models, collapse = ", "), "\n\n")

# Renombrar para paleorotate
df <- df %>% rename(orig_lat = lat, orig_lng = lng)

# --- DEPURACIÓN: muestra de datos de entrada ---
cat("Muestra de datos antes de paleorotate:\n")
print(head(df, 5))

# --- Ejecutar palaeorotate ---
cat("\n=== Ejecutando palaeorotate() ===\n")

if(length(models) > 1) {
  rotated <- palaeorotate(df, method = "point",
                          lng = "orig_lng", lat = "orig_lat",
                          age = "age_mean", model = models,
                          uncertainty = TRUE)

  cat("=== Resultado crudo de palaeorotate (primeras 5 filas) ===\n")
  print(head(rotated, 5))
  cat("\nColumnas generadas por palaeorotate:\n")
  print(names(rotated))
  cat("\n")

  rotated_long <- pivot_longer(rotated, 
                               cols = starts_with("p_lat_") | starts_with("p_lng_"),
                               names_to = c(".value", "model"),
                               names_pattern = "p_(lat|lng)_(.+)") %>%
    rename(p_lat = lat, p_lng = lng) %>%
    select(Name, Period, lat = orig_lat, lng = orig_lng, age_mean, p_lat, p_lng, model, range_p_lat, max_dist) %>%
    filter(!is.na(p_lng) & !is.na(p_lat))
  result <- rotated_long

} else {
  rotated <- palaeorotate(df, method = "point",
                          lng = "orig_lng",
                          lat = "orig_lat",
                          age = "age_mean",
                          model = models,
                          uncertainty = TRUE,
                          round = NULL)

  cat("=== Resultado crudo de palaeorotate (primeras 5 filas) ===\n")
  print(head(rotated, 5))
  cat("\nColumnas generadas por palaeorotate:\n")
  print(names(rotated))
  cat("\n")

  # Columnas base y opcionales
  base_cols <- c("Name", "Period", "orig_lng", "orig_lat", 
                 "age_min", "age_max", "age_mean", "p_lng", "p_lat")
  optional_cols <- c("range_p_lat", "max_dist")
  available_cols <- intersect(optional_cols, names(rotated))

  cat("Columnas opcionales detectadas:", paste(available_cols, collapse = ", "), "\n\n")

  result <- rotated %>%
    select(all_of(base_cols), all_of(available_cols)) %>%
    rename(
      lng = orig_lng,
      lat = orig_lat,
      range_p_lat = dplyr::any_of("range_p_lat"),
      max_dist = dplyr::any_of("max_dist")
    ) %>%
    filter(!is.na(p_lng) & !is.na(p_lat)) %>%
    mutate(model = models)
}

cat("\nFilas finales:", nrow(result), "\n")
cat("Columnas finales:", paste(names(result), collapse = ", "), "\n\n")

# Crear carpeta de salida si es necesario
if (!grepl("^/", output_csv)) {
  if(!dir.exists("results")) {
    dir.create("results")
  }
  output_path <- file.path("results", output_csv)
} else {
  output_path <- output_csv
}

# Guardar CSV
cat("Guardando resultados en:", output_path, "\n")
write.csv(result, output_path, row.names = FALSE, fileEncoding = "UTF-8")
cat("=== Proceso completado con éxito ===\n")
