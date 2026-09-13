package com.clubinfo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Super Administrateur — hérite de Administrateur. */
@Getter
@Setter
@Entity
@DiscriminatorValue("SuperAdmin")
public class SuperAdmin extends Administrateur {
}
