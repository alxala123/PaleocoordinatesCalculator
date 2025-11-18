#!/usr/bin/env Rscript

library(palaeoverse)

args <- commandArgs(trailingOnly = TRUE)
lat <- as.numeric(args[1])
lng <- as.numeric(args[2])

age_jurassic <- 145


df <- data.frame(
  lng = c(lng, lng),
  lat = c(lat, lat),
  age = c(age_jurassic, age_jurassic)
)

rotated <- palaeoverse::palaeorotate(
  occdf = df,
  method = "point",
  lng = "lng",
  lat = "lat",
  age = "age",
  model = "PALEOMAP",
  uncertainty = TRUE,
  round = NULL
)

print(rotated)  

rotated_single <- rotated[1, ]
print(rotated_single)
if (is.na(rotated_single$p_lng) || is.na(rotated_single$p_lat)) {
  rotated_single$p_lng <- lng
  rotated_single$p_lat <- lat
}
print(rotated_single)
rotated_single$original_lng <- lng
rotated_single$original_lat <- lat
print(rotated_single)

write.csv(rotated_single, file = "results/rotated.csv", row.names = FALSE)
