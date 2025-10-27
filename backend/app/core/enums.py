from enum import Enum


class CardStatus(str, Enum):
    todo = "todo"
    doing = "doing"
    done = "done"
