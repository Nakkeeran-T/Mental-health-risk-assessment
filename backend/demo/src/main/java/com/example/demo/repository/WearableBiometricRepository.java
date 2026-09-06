package com.example.demo.repository;

import com.example.demo.entity.WearableBiometric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

public interface WearableBiometricRepository extends JpaRepository<WearableBiometric, Long> {

    List<WearableBiometric> findByUserIdOrderBySyncedAtDesc(Long userId);

    Optional<WearableBiometric> findFirstByUserIdOrderBySyncedAtDesc(Long userId);
}
