/*- Global allowances -*/
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
#![allow(
    dead_code,
    unused_imports
)]

/*- Imports -*/
use titlebar::WindowExt;
use rayon::prelude::*;

// Hide titlebar window-extension
mod titlebar;
use tauri::Manager;

// Simulation imports
mod simulation;
use rand::{ self, Rng };
use simulation::{ Grid, Cell, GridConfig, new_iteration };

// Simulation handler
mod sim_handler;
use sim_handler::GridStateHandler;

/*- Commands -*/
#[tauri::command]
fn new_game(
    predator_death_chance: f64,
    predator_reproduce_chance: f64,
    death_chance: f64,
    reproduce_chance: f64,
    spawn_chance: f64,
    predator_spawn_chance: f64,
    size: usize,
    state: tauri::State<GridStateHandler>
) -> () {
    *state.0.lock().unwrap() = Grid::new(size, GridConfig {
        predator_death_chance,
        predator_reproduce_chance,
        death_chance,
        reproduce_chance,
        spawn_chance,
        predator_spawn_chance
    });
}

/*- Update grid -*/
#[tauri::command]
fn update(state: tauri::State<GridStateHandler>) -> () {
    /*- Change all cells -*/
    let new_grid = new_iteration(&*state.0.lock().unwrap());

    /*- Update state -*/
    *state.0.lock().unwrap() = new_grid;
}

/*- Get grid -*/
#[tauri::command]
fn get(state: tauri::State<GridStateHandler>) -> Vec<u8> {
    /*- Change all cells -*/
    state.0.lock().unwrap().to_cell_vector().to_vec()
}

/*- Get status -*/
#[tauri::command]
fn preys_won(state: tauri::State<GridStateHandler>) -> bool { let game = state.0.lock().unwrap(); game.prey_exist && !game.cells_exist }
#[tauri::command]
fn cells_won(state: tauri::State<GridStateHandler>) -> bool { let game = state.0.lock().unwrap(); game.cells_exist && !game.prey_exist }
#[tauri::command]
fn iterations(state: tauri::State<GridStateHandler>) -> usize { let game = state.0.lock().unwrap(); game.iterations }
#[tauri::command]
fn amount_of_cells(state: tauri::State<GridStateHandler>) -> usize { let game = state.0.lock().unwrap(); game.amount_of_cells }
#[tauri::command]
fn amount_of_predators(state: tauri::State<GridStateHandler>) -> usize { let game = state.0.lock().unwrap(); game.amount_of_predators }
#[tauri::command]
fn size(state: tauri::State<GridStateHandler>) -> usize { let game = state.0.lock().unwrap(); game.grid_size }

/*- Main -*/
fn main() {
    tauri::Builder::default()
        /*- State management -*/
        .manage(GridStateHandler(Default::default()))

        /*- Port functions to js -*/
        .invoke_handler(tauri::generate_handler![
            new_game,
            update,
            get,
            preys_won,
            cells_won,
            iterations,
            amount_of_cells,
            amount_of_predators,
            size
        ])

        /*- Hide titlebar -*/
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window.set_transparent_titlebar(true, true);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

