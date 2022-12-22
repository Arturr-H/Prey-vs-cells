/*- Imports -*/
use std::sync::Mutex;

// Simulation imports
use rand::{ self, Rng };
use crate::simulation::{ Grid, Cell, GridConfig };

/*- Structs -*/
pub struct GridStateHandler(pub Mutex<Grid>);

/*- Method implementations -*/
impl GridStateHandler {
    pub fn reset(&mut self) {
        *self.0.lock().unwrap() = Grid::default()
    }
}
