package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** DSI — Directeur des Systèmes d'Information. Hérite de Administrateur. */
@Getter
@Setter
@Entity
@DiscriminatorValue("DSI")
public class DSI extends Administrateur {
}
