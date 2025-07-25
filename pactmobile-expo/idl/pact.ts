export type Pact = {
  "version": "0.1.0",
  "name": "pact",
  "instructions": [
    {
      "name": "initializePlayerProfile",
      "accounts": [
        {
          "name": "playerProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "player",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeChallengePact",
      "accounts": [
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerGoal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pactVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "playerProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "player",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "goalType",
          "type": {
            "defined": "GoalType"
          }
        },
        {
          "name": "goalValue",
          "type": "u64"
        },
        {
          "name": "verificationType",
          "type": {
            "defined": "VerificationType"
          }
        },
        {
          "name": "comparisonOperator",
          "type": {
            "defined": "ComparisonOperator"
          }
        },
        {
          "name": "stake",
          "type": "u64"
        }
      ]
    },
    {
      "name": "joinChallengePact",
      "accounts": [
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerGoal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "playerProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "player",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "stakeAmountForChallengePact",
      "accounts": [
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerGoal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pactVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "player",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "startChallengePact",
      "accounts": [
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "player",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "endChallengePact",
      "accounts": [
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pactVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "winner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updatePlayerGoal",
      "accounts": [
        {
          "name": "playerGoal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "player",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "isEliminated",
          "type": "bool"
        },
        {
          "name": "eliminatedAt",
          "type": {
            "option": "i64"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "challengePact",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "participants",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "status",
            "type": {
              "defined": "PactStatus"
            }
          },
          {
            "name": "goalType",
            "type": {
              "defined": "GoalType"
            }
          },
          {
            "name": "goalValue",
            "type": "u64"
          },
          {
            "name": "verificationType",
            "type": {
              "defined": "VerificationType"
            }
          },
          {
            "name": "comparisonOperator",
            "type": {
              "defined": "ComparisonOperator"
            }
          },
          {
            "name": "stake",
            "type": "u64"
          },
          {
            "name": "prizePool",
            "type": "u64"
          },
          {
            "name": "pactVault",
            "type": "publicKey"
          },
          {
            "name": "pactVaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "playerProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "activePacts",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "pactsWon",
            "type": "u64"
          },
          {
            "name": "pactsLost",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "playerGoalForChallengePact",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "publicKey"
          },
          {
            "name": "pact",
            "type": "publicKey"
          },
          {
            "name": "hasStaked",
            "type": "bool"
          },
          {
            "name": "isEliminated",
            "type": "bool"
          },
          {
            "name": "eliminatedAt",
            "type": {
              "option": "i64"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "PactStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Initialized"
          },
          {
            "name": "Active"
          },
          {
            "name": "Completed"
          },
          {
            "name": "Cancelled"
          }
        ]
      }
    },
    {
      "name": "GoalType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "DailySteps"
          },
          {
            "name": "DailyRunKm"
          },
          {
            "name": "DailyCaloriesBurned"
          },
          {
            "name": "DailyScreenTimeMax"
          },
          {
            "name": "DailyPhonePickupsMax"
          },
          {
            "name": "DailyGithubContribution"
          },
          {
            "name": "DailyLeetCodeProblems"
          },
          {
            "name": "TotalSteps"
          },
          {
            "name": "TotalCaloriesBurned"
          },
          {
            "name": "TotalDistanceKm"
          },
          {
            "name": "TotalLeetCodeSolved"
          }
        ]
      }
    },
    {
      "name": "VerificationType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ScreenTime"
          },
          {
            "name": "GitHubAPI"
          },
          {
            "name": "LeetCodeScrape"
          },
          {
            "name": "Strava"
          }
        ]
      }
    },
    {
      "name": "ComparisonOperator",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "GreaterThanOrEqual"
          },
          {
            "name": "LessThanOrEqual"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PactNotInitialized",
      "msg": "Pact is not initialized"
    },
    {
      "code": 6001,
      "name": "AlreadyJoined",
      "msg": "Player has already joined this pact"
    },
    {
      "code": 6002,
      "name": "NotPactCreator",
      "msg": "Player is not the creator of this pact"
    },
    {
      "code": 6003,
      "name": "NotParticipant",
      "msg": "Player is not a participant in this pact"
    },
    {
      "code": 6004,
      "name": "PactAlreadyActive",
      "msg": "Pact is already active"
    },
    {
      "code": 6005,
      "name": "PactAlreadyCompleted",
      "msg": "Pact is already completed"
    },
    {
      "code": 6006,
      "name": "PactAlreadyCancelled",
      "msg": "Pact is already cancelled"
    },
    {
      "code": 6007,
      "name": "InvalidGoalType",
      "msg": "Invalid goal type for this pact"
    },
    {
      "code": 6008,
      "name": "InvalidVerificationType",
      "msg": "Invalid verification type for this pact"
    },
    {
      "code": 6009,
      "name": "InvalidComparisonOperator",
      "msg": "Invalid comparison operator for this pact"
    },
    {
      "code": 6010,
      "name": "PrizePoolMustBeGreaterThanZero",
      "msg": "Prize pool must be greater than zero"
    },
    {
      "code": 6011,
      "name": "AlreadyStaked",
      "msg": "Player has already staked in this pact"
    },
    {
      "code": 6012,
      "name": "PlayerNotStaked",
      "msg": "Player has not staked yet."
    },
    {
      "code": 6013,
      "name": "MissingPlayerGoal",
      "msg": "Missing PlayerGoal account for a participant."
    }
  ]
};

export const IDL: Pact = {
  "version": "0.1.0",
  "name": "pact",
  "instructions": [
    {
      "name": "initializePlayerProfile",
      "accounts": [
        {
          "name": "playerProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "player",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeChallengePact",
      "accounts": [
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerGoal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pactVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "playerProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "player",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "goalType",
          "type": {
            "defined": "GoalType"
          }
        },
        {
          "name": "goalValue",
          "type": "u64"
        },
        {
          "name": "verificationType",
          "type": {
            "defined": "VerificationType"
          }
        },
        {
          "name": "comparisonOperator",
          "type": {
            "defined": "ComparisonOperator"
          }
        },
        {
          "name": "stake",
          "type": "u64"
        }
      ]
    },
    {
      "name": "joinChallengePact",
      "accounts": [
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerGoal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "playerProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "player",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "stakeAmountForChallengePact",
      "accounts": [
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "playerGoal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pactVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "player",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "startChallengePact",
      "accounts": [
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "player",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "endChallengePact",
      "accounts": [
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pactVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "winner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updatePlayerGoal",
      "accounts": [
        {
          "name": "playerGoal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "challengePact",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "appVault",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "player",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "isEliminated",
          "type": "bool"
        },
        {
          "name": "eliminatedAt",
          "type": {
            "option": "i64"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "challengePact",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "participants",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "status",
            "type": {
              "defined": "PactStatus"
            }
          },
          {
            "name": "goalType",
            "type": {
              "defined": "GoalType"
            }
          },
          {
            "name": "goalValue",
            "type": "u64"
          },
          {
            "name": "verificationType",
            "type": {
              "defined": "VerificationType"
            }
          },
          {
            "name": "comparisonOperator",
            "type": {
              "defined": "ComparisonOperator"
            }
          },
          {
            "name": "stake",
            "type": "u64"
          },
          {
            "name": "prizePool",
            "type": "u64"
          },
          {
            "name": "pactVault",
            "type": "publicKey"
          },
          {
            "name": "pactVaultBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "playerProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "activePacts",
            "type": {
              "vec": "publicKey"
            }
          },
          {
            "name": "pactsWon",
            "type": "u64"
          },
          {
            "name": "pactsLost",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "playerGoalForChallengePact",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "publicKey"
          },
          {
            "name": "pact",
            "type": "publicKey"
          },
          {
            "name": "hasStaked",
            "type": "bool"
          },
          {
            "name": "isEliminated",
            "type": "bool"
          },
          {
            "name": "eliminatedAt",
            "type": {
              "option": "i64"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "PactStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Initialized"
          },
          {
            "name": "Active"
          },
          {
            "name": "Completed"
          },
          {
            "name": "Cancelled"
          }
        ]
      }
    },
    {
      "name": "GoalType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "DailySteps"
          },
          {
            "name": "DailyRunKm"
          },
          {
            "name": "DailyCaloriesBurned"
          },
          {
            "name": "DailyScreenTimeMax"
          },
          {
            "name": "DailyPhonePickupsMax"
          },
          {
            "name": "DailyGithubContribution"
          },
          {
            "name": "DailyLeetCodeProblems"
          },
          {
            "name": "TotalSteps"
          },
          {
            "name": "TotalCaloriesBurned"
          },
          {
            "name": "TotalDistanceKm"
          },
          {
            "name": "TotalLeetCodeSolved"
          }
        ]
      }
    },
    {
      "name": "VerificationType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ScreenTime"
          },
          {
            "name": "GitHubAPI"
          },
          {
            "name": "LeetCodeScrape"
          },
          {
            "name": "Strava"
          }
        ]
      }
    },
    {
      "name": "ComparisonOperator",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "GreaterThanOrEqual"
          },
          {
            "name": "LessThanOrEqual"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PactNotInitialized",
      "msg": "Pact is not initialized"
    },
    {
      "code": 6001,
      "name": "AlreadyJoined",
      "msg": "Player has already joined this pact"
    },
    {
      "code": 6002,
      "name": "NotPactCreator",
      "msg": "Player is not the creator of this pact"
    },
    {
      "code": 6003,
      "name": "NotParticipant",
      "msg": "Player is not a participant in this pact"
    },
    {
      "code": 6004,
      "name": "PactAlreadyActive",
      "msg": "Pact is already active"
    },
    {
      "code": 6005,
      "name": "PactAlreadyCompleted",
      "msg": "Pact is already completed"
    },
    {
      "code": 6006,
      "name": "PactAlreadyCancelled",
      "msg": "Pact is already cancelled"
    },
    {
      "code": 6007,
      "name": "InvalidGoalType",
      "msg": "Invalid goal type for this pact"
    },
    {
      "code": 6008,
      "name": "InvalidVerificationType",
      "msg": "Invalid verification type for this pact"
    },
    {
      "code": 6009,
      "name": "InvalidComparisonOperator",
      "msg": "Invalid comparison operator for this pact"
    },
    {
      "code": 6010,
      "name": "PrizePoolMustBeGreaterThanZero",
      "msg": "Prize pool must be greater than zero"
    },
    {
      "code": 6011,
      "name": "AlreadyStaked",
      "msg": "Player has already staked in this pact"
    },
    {
      "code": 6012,
      "name": "PlayerNotStaked",
      "msg": "Player has not staked yet."
    },
    {
      "code": 6013,
      "name": "MissingPlayerGoal",
      "msg": "Missing PlayerGoal account for a participant."
    }
  ]
};
