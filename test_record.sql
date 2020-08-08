INSERT INTO Statuses(StatusName, Active)
VALUES(
	"Do Not Call",
	1
);


INSERT INTO Towns(TownName)
VALUES(
	"Pottsville"
);


INSERT INTO Territories(TerritoryName, TownId)
VALUES(
	"Pottsville-1",
	1
);


INSERT INTO Addresses(Address, Address2, TerritoryId)
VALUES(
	"123 Main Street",
	NULL,
	1
);

INSERT INTO Records(AddressId, Notes, StatusId, DateCreated)
VALUES(
	1,
	NULL,
	1,
	'2020-07-27'
);

