fun getIsoField(fieldNo: Byte, isReq: Boolean = true, processingCode : String = ""): IsoField {
    val isEnableP2PE = AppPreference.isEnableP2PE()

    return when (fieldNo) {
        1.toByte() -> IsoField(1, "Bitmap", true, len = 8)
        2.toByte() -> IsoField(2, "PAN / Mobile", true, len = 8)
        3.toByte() -> IsoField(3, "Processing Code", true, len = 3)
        4.toByte() -> IsoField(4, "Transaction Amount", true, len = 6)
        5.toByte() -> IsoField()
        6.toByte() -> IsoField(6, "DCC final amount", true, len = 6)
        7.toByte() -> IsoField(7, "Server Transmission DateA nd Time", true, len = 5)
        8.toByte() -> IsoField()
        9.toByte() -> IsoField()
        10.toByte() -> IsoField(10, "DCC Conversion detail", true, len = 4)
        11.toByte() -> IsoField(11, "STAN", true, len = 3)
        12.toByte() -> {
            if (isReq) {
                IsoField(12, "Local  Transaction Time", true, len = 3)
            } else {
                IsoField(12, "Local  Transaction Date Time", true, len = 6)
            }
        }
        13.toByte() -> IsoField(13, "Local  Transaction Date", true, len = 2)
        14.toByte() -> IsoField(14, "Expiry Date", true, len = 2)
        15.toByte() -> IsoField(15, "Settlement Date", true, len = 2)
        16.toByte() -> IsoField()
        17.toByte() -> IsoField(17, "Effective Date", true, len = 2)
        18.toByte() -> IsoField()
        19.toByte() -> IsoField()
        20.toByte() -> IsoField()
        21.toByte() -> IsoField()
        22.toByte() -> IsoField(22, "POS Code", true, len = 2)
        23.toByte() -> IsoField(23, "Address/Application Sequence Number", true, len = 3)
        24.toByte() -> IsoField(24, "Destination NII (Network International Identifier)", true, len = 2)
        25.toByte() -> IsoField(25)
        26.toByte() -> IsoField(26)
        27.toByte() -> IsoField(27)
        28.toByte() -> IsoField(28)
        29.toByte() -> IsoField(29)
        30.toByte() -> IsoField(30, "Original Amount", true, len = 6)
        31.toByte() -> IsoField(31, "Acquirer Ref No", fieldType = ISO_FIELD_TYPE.LLVR, len = 1)
        32.toByte() -> IsoField(32, "Acquiring Institution Id Code", fieldType = ISO_FIELD_TYPE.LLVR, len = 1)
        33.toByte() -> IsoField(33)
        34.toByte() -> IsoField(34)
        35.toByte() -> IsoField(35, "Track2", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        36.toByte() -> IsoField(36)
        37.toByte() -> IsoField(37, "Retrieval Reference Number", true, len = 12)
        38.toByte() -> IsoField(38, "Approval Code", true, len = 12)
        39.toByte() -> IsoField(39, "Response Code", true, len = 2)
        40.toByte() -> IsoField()
        41.toByte() -> IsoField(41, "TID", true, len = 8, fieldType = ISO_FIELD_TYPE.BYTE)
        42.toByte() -> IsoField(42, "MID", true, len = 15, fieldType = ISO_FIELD_TYPE.BYTE)
        43.toByte() -> IsoField(43, "Unique Txn ID", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        44.toByte() -> IsoField(44, "Additional Response Data", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        45.toByte() -> IsoField(45, "Track1", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        46.toByte() -> {
            if(isEnableP2PE){
                IsoField(46,"KSN details",fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
            }else{
                IsoField(46)
            }
        }
        47.toByte() -> IsoField(47, "User Id, Customer Id", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        48.toByte() -> IsoField(48, "Connection code and date time stamp", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        49.toByte() -> IsoField(49, "Transaction Currency Code", true, len = 2)
        50.toByte() -> IsoField(50)
        51.toByte() -> IsoField(51, "Cardholder currency code", true, len = 2)
        52.toByte() -> IsoField(52, "Pin Block", true, len = 8, fieldType = ISO_FIELD_TYPE.BYTE)
        53.toByte() -> {
            if(isEnableP2PE){
                IsoField(53, "AES PIN Block", fieldType = ISO_FIELD_TYPE.LLVR, len = 1)
            }else{
                IsoField(53, "CVV", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
            }
        }
        54.toByte() -> IsoField(54, "Additional Amount", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        55.toByte() -> IsoField(55, "ICC Data", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        56.toByte() -> {
            if(isReq){
                when(processingCode){
                    ProcessingCode.COMMON_API_2.code,//BankEMI
                    ProcessingCode.DIGITALONBOARDING.code,
                    ProcessingCode.MUTUAL_AUTHENTICATION.code ->{
                        IsoField(56, "Previous ROC, Date, Time in Reversal case", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
                    }else -> {
                    IsoField(56, "Previous ROC, Date, Time in Reversal case", fieldType = ISO_FIELD_TYPE.LLVR, len = 1)
                }
                }
            }
            else{
                IsoField(56, "Previous ROC, Date, Time in Reversal case", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
            }
        }
        57.toByte() -> IsoField(57, "Track2 Encrypted", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        58.toByte() -> IsoField(58, "Card Indicator and Response Message", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        59.toByte() -> IsoField(59, "DCC detail / RSA Key in Request, Advice in response", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        60.toByte() -> IsoField(60, "Batch No", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        61.toByte() -> IsoField(61, "Bank Details", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        62.toByte() -> IsoField(62, "Invoice No", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)
        63.toByte() -> IsoField(63, "Promo Details", fieldType = ISO_FIELD_TYPE.LLVR, len = 2)

        else -> IsoField()
    }
}