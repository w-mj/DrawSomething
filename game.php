<?php
/**
 * Created by PhpStorm.
 * User: wmj
 * Date: 8/1/18
 * Time: 2:38 PM
 */


class Player {
    public $connection;  // a user's connection is also used as its unique id.
    public $room = null;
    public $nickname = 'anonymous';
    public $score = 0;
    function __construct($connection) {
        $this->connection = $connection;
    }
}

$maxGameRoom = 10;
$roomNumberPool = range(100, 100 + $maxGameRoom);
shuffle($roomNumberPool);
$roomCount = 0;
$roomList = array_fill_keys($roomNumberPool, null);  // create room number list.

/**
 * find a free room and return its number, otherwise return null.
 * @return null|string
 */
function findFree () {
    global $roomList;
    foreach ($roomList as $num => $room) {
        if ($room == null)
            return $num;
    }
    return null;
}
class Room {
    private $roomNumber;
    private $players = array();
    function __construct($host){  // a room must have at least one player.
        $this->roomNumber = findFree();  // new room
        global $roomList;
        if ($this->roomNumber != null)  // if find a free room successfully, put room into the list.
            $roomList[$this->roomNumber] = $this;
        $this->userJoin($host);
    }

    public function getRoomNumber()
    {
        return $this->roomNumber;
    }

    public function userJoin(Player $player) {
        $this->players[$player->connection] = $player;  // A player join the room
    }

    public function userLeave(Player $player) {
        unset($this->players[$player->connection]);
        if (count($this->players) == 0) {  // if all players leave the room, release.
            global $roomList;
            unset($roomList[$this->roomNumber]);
        }
    }
}