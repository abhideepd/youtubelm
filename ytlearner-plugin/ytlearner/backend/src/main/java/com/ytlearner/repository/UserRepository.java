package com.ytlearner.repository;

import com.ytlearner.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByYoutubeId(String youtubeId);
    Optional<User> findByEmail(String email);
}
